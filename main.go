package main

import (
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

// 消息类型常量
const (
	SEND_TYPE_REG              = "1001" // 注册后发送用户id
	SEND_TYPE_ROOM_INFO        = "1002" // 发送房间信息
	SEND_TYPE_JOINED_ROOM      = "1003" // 加入房间后的通知
	SEND_TYPE_NEW_CANDIDATE    = "1004" // candidate
	SEND_TYPE_NEW_CONNECTION   = "1005" // new connection
	SEND_TYPE_CONNECTED        = "1006" // connected
	SEND_TYPE_NICKNAME_UPDATED = "1007" // 昵称更新通知

	RECEIVE_TYPE_NEW_CANDIDATE   = "9001" // candidate
	RECEIVE_TYPE_NEW_CONNECTION  = "9002" // new connection
	RECEIVE_TYPE_CONNECTED       = "9003" // connected
	RECEIVE_TYPE_KEEPALIVE       = "9999" // keep-alive
	RECEIVE_TYPE_UPDATE_NICKNAME = "9004" // 更新昵称请求
)

var (
	//go:embed www
	embededFiles  embed.FS
	httpPort      = flag.Int("port", 8081, "HTTP server port")
	httpDirectory = "www"
	upgrader      = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // 允许所有来源
		},
	}
)

// TurnServer TURN服务器配置
type TurnServer struct {
	URLs       []string `json:"urls"`
	Username   string   `json:"username,omitempty"`
	Credential string   `json:"credential,omitempty"`
}

// RoomConfig 房间配置
type RoomConfig struct {
	RoomID string       `json:"roomId"`
	Pwd    string       `json:"pwd"`
	Turns  []TurnServer `json:"turns"`
	Remark string       `json:"remark,omitempty"`
}

// Message WebSocket 消息结构
type Message struct {
	Type     string          `json:"type"`
	UID      string          `json:"uid,omitempty"`
	TargetID string          `json:"targetId,omitempty"`
	Data     json.RawMessage `json:"data,omitempty"`
}

// Response WebSocket 响应结构
type Response struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

var (
	service  *Service
	roomPwds map[string]*RoomConfig
)

func init() {
	// 自定义日志格式
	log.SetFlags(0)
	log.SetOutput(&logWriter{})
}

type logWriter struct{}

func (w *logWriter) Write(p []byte) (n int, err error) {
	now := time.Now()
	timestamp := fmt.Sprintf("[%04d-%02d-%02d %02d:%02d:%02d. %03d]",
		now.Year(), now.Month(), now.Day(),
		now.Hour(), now.Minute(), now.Second(),
		now.Nanosecond()/1000000)
	return fmt.Fprintf(os.Stdout, "%s %s", timestamp, string(p))
}

func main() {
	c := flag.String("c", "room_pwd.json", "room password config file")
	cert := flag.String("cert", "", "cert file")
	key := flag.String("key", "", "key file")
	publicIP := flag.String("public-ip", "", "TURN server public IP")
	turnPort := flag.Int("turn-port", 3478, "TURN server port")
	turnUsers := flag.String("turn-users", "", "TURN server users in format user1=pass1,user2=pass2")
	flag.Parse()

	// 初始化服务
	service = NewService()

	// 加载房间配置
	loadRoomConfig(*c)

	http.HandleFunc("/", handleHTTP)
	// 设置路由
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/ws/", handleWebSocket)
	if len(*publicIP) > 0 && len(*turnUsers) > 0 {
		log.Printf("Starting TURN server on %s:%d\n", *publicIP, *turnPort)
		startTURN(publicIP, turnPort, turnUsers)
	}
	addr := fmt.Sprintf(":%d", *httpPort)
	log.Printf("server start on port %d\n", *httpPort)

	if len(*cert) > 0 {
		if err := http.ListenAndServeTLS(addr, *cert, *key, nil); err != nil {
			log.Fatalf("Server failed:  %v\n", err)
		}
	} else {
		if err := http.ListenAndServe(addr, nil); err != nil {
			log.Fatalf("Server failed:  %v\n", err)
		}
	}

}

// 加载房间配置
func loadRoomConfig(room_pwd string) {
	roomPwds = make(map[string]*RoomConfig)

	// 获取可执行文件所在目录
	exePath, err := os.Executable()
	if err != nil {
		return
	}
	exeDir := filepath.Dir(exePath)
	configPath := filepath.Join(exeDir, room_pwd)

	// 尝试读取配置文件
	data, err := os.ReadFile(configPath)
	if err != nil {
		// 配置文件不存在不报错
		return
	}

	var configs []RoomConfig
	if err := json.Unmarshal(data, &configs); err != nil {
		log.Printf("Failed to parse room_pwd.json: %v\n", err)
		return
	}

	roomIds := []string{}
	for _, config := range configs {
		roomPwds[config.RoomID] = &RoomConfig{
			RoomID: config.RoomID,
			Pwd:    config.Pwd,
			Turns:  config.Turns,
		}
		roomIds = append(roomIds, config.RoomID)
	}

	if len(roomIds) > 0 {
		log.Printf("加载房间数据: %s\n", strings.Join(roomIds, ","))
	}
}

// 处理 HTTP 请求（静态文件服务）
func handleHTTP(w http.ResponseWriter, r *http.Request) {
	urlPath := r.URL.Path
	if urlPath == "/" {
		urlPath = "/index.html"
	}

	filePath := filepath.Join(httpDirectory, urlPath)

	// 检查文件是否存在
	info, err := fs.Stat(embededFiles, filePath)
	if err != nil || info.IsDir() {
		// 文件不存在，返回 index.html
		filePath = filepath.Join(httpDirectory, "index.html")
	}

	// 设置适当的 Content-Type 和缓存头
	ext := filepath.Ext(filePath)
	switch ext {
	case ".css":
		w.Header().Set("Content-Type", "text/css")
		w.Header().Set("Cache-Control", "public, max-age=2592000") // 30天缓存
	case ".png":
		w.Header().Set("Content-Type", "image/png")
		w.Header().Set("Cache-Control", "public, max-age=2592000") // 30天缓存
	case ".jpg", ".jpeg":
		w.Header().Set("Content-Type", "image/jpeg")
		w.Header().Set("Cache-Control", "public, max-age=2592000") // 30天缓存
	case ".svg":
		w.Header().Set("Content-Type", "image/svg+xml")
		w.Header().Set("Cache-Control", "public, max-age=2592000") // 30天缓存
	case ".js":
		w.Header().Set("Content-Type", "application/javascript")
		w.Header().Set("Cache-Control", "public, max-age=2592000") // 30天缓存
	case ".html":
		w.Header().Set("Content-Type", "text/html")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	}

	// 读取并返回文件
	file, err := embededFiles.Open(filePath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	io.Copy(w, file)
}

// 处理 WebSocket 连接
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// 获取客户端 IP
	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = r.Header.Get("X-Real-IP")
	}
	if ip == "" {
		ip = strings.Replace(r.RemoteAddr, "::ffff:", "", 1)
		// 移除端口号
		if idx := strings.LastIndex(ip, ":"); idx != -1 {
			ip = ip[:idx]
		}
	}

	// 解析 URL 路径获取房间ID和密码
	urlPath := strings.TrimPrefix(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")

	var roomID, pwd string
	var turns []TurnServer

	if len(parts) > 1 && len(parts[1]) > 0 && len(parts[1]) <= 32 {
		roomID = strings.TrimSpace(parts[1])
	}
	if len(parts) > 2 && len(parts[2]) > 0 && len(parts[2]) <= 32 {
		pwd = strings.TrimSpace(parts[2])
	}

	// 兼容旧版本
	if roomID == "ws" || roomID == "" {
		roomID = ""
	}

	// 验证房间密码
	if roomID != "" {
		if config, ok := roomPwds[roomID]; ok {
			if pwd == "" || !strings.EqualFold(config.Pwd, pwd) {
				roomID = ""
			} else {
				turns = config.Turns
			}
		} else {
			roomID = ""
		}
	}

	// 升级为 WebSocket 连接
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v\n", err)
		return
	}

	// 注册用户
	currentID := service.RegisterUser(ip, roomID, conn)

	// 发送用户ID
	sendUserId(conn, currentID, roomID, turns)

	log.Printf("%s@%s%s connected\n", currentID, ip, formatRoomID(roomID))

	// 通知所有用户房间信息
	for _, user := range service.GetUserList(ip, roomID) {
		sendRoomInfo(user.Socket, ip, roomID)
	}

	// 通知用户已加入房间
	sendJoinedRoom(conn, currentID)

	// 处理消息
	go handleMessages(conn, ip, roomID, currentID)
}

// 处理 WebSocket 消息
func handleMessages(conn *websocket.Conn, ip, roomID, currentID string) {
	defer func() {
		service.UnregisterUser(ip, roomID, currentID)
		for _, user := range service.GetUserList(ip, roomID) {
			sendRoomInfo(user.Socket, ip, roomID)
		}
		log.Printf("%s@%s%s disconnected\n", currentID, ip, formatRoomID(roomID))
		conn.Close()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		// 限制消息大小
		if len(message) > 1024*10 {
			continue
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Invalid JSON: %s\n", string(message))
			continue
		}

		if msg.Type == "" || msg.UID == "" || msg.TargetID == "" {
			continue
		}

		me := service.GetUser(ip, roomID, msg.UID)
		target := service.GetUser(ip, roomID, msg.TargetID)
		if me == nil || target == nil {
			continue
		}

		switch msg.Type {
		case RECEIVE_TYPE_NEW_CANDIDATE:
			var data struct {
				Candidate json.RawMessage `json:"candidate"`
			}
			json.Unmarshal(msg.Data, &data)
			sendCandidate(target.Socket, msg.UID, data.Candidate)

		case RECEIVE_TYPE_NEW_CONNECTION:
			var data struct {
				TargetAddr json.RawMessage `json:"targetAddr"`
			}
			json.Unmarshal(msg.Data, &data)
			sendConnectInvite(target.Socket, msg.UID, data.TargetAddr)

		case RECEIVE_TYPE_CONNECTED:
			var data struct {
				TargetAddr json.RawMessage `json:"targetAddr"`
			}
			json.Unmarshal(msg.Data, &data)
			sendConnected(target.Socket, msg.UID, data.TargetAddr)

		case RECEIVE_TYPE_KEEPALIVE:
			// Keep-alive, 不需要处理

		case RECEIVE_TYPE_UPDATE_NICKNAME:
			var data struct {
				Nickname string `json:"nickname"`
			}
			json.Unmarshal(msg.Data, &data)
			if service.UpdateNickname(ip, roomID, msg.UID, data.Nickname) {
				// 通知所有用户昵称更新
				for _, user := range service.GetUserList(ip, roomID) {
					sendNicknameUpdated(user.Socket, msg.UID, data.Nickname)
				}
			}
		}
	}
}

// 发送消息的辅助函数
func send(conn *websocket.Conn, msgType string, data interface{}) {
	resp := Response{
		Type: msgType,
		Data: data,
	}
	conn.WriteJSON(resp)
}

func sendUserId(conn *websocket.Conn, id, roomID string, turns []TurnServer) {
	send(conn, SEND_TYPE_REG, map[string]interface{}{
		"id":     id,
		"roomId": roomID,
		"turns":  turns,
	})
}

func sendRoomInfo(conn *websocket.Conn, ip, roomID string) {
	users := service.GetUserList(ip, roomID)
	result := make([]map[string]string, len(users))
	for i, user := range users {
		result[i] = map[string]string{
			"id":       user.ID,
			"nickname": user.Nickname,
		}
	}
	send(conn, SEND_TYPE_ROOM_INFO, result)
}

func sendJoinedRoom(conn *websocket.Conn, id string) {
	send(conn, SEND_TYPE_JOINED_ROOM, map[string]string{"id": id})
}

func sendCandidate(conn *websocket.Conn, targetID string, candidate json.RawMessage) {
	send(conn, SEND_TYPE_NEW_CANDIDATE, map[string]interface{}{
		"targetId":  targetID,
		"candidate": candidate,
	})
}

func sendConnectInvite(conn *websocket.Conn, targetID string, offer json.RawMessage) {
	send(conn, SEND_TYPE_NEW_CONNECTION, map[string]interface{}{
		"targetId": targetID,
		"offer":    offer,
	})
}

func sendConnected(conn *websocket.Conn, targetID string, answer json.RawMessage) {
	send(conn, SEND_TYPE_CONNECTED, map[string]interface{}{
		"targetId": targetID,
		"answer":   answer,
	})
}

func sendNicknameUpdated(conn *websocket.Conn, id, nickname string) {
	send(conn, SEND_TYPE_NICKNAME_UPDATED, map[string]interface{}{
		"id":       id,
		"nickname": nickname,
	})
}

func formatRoomID(roomID string) string {
	if roomID == "" {
		return ""
	}
	return "/" + roomID
}
