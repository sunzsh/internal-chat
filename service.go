package main

import (
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
)

// User 用户结构
type User struct {
	ID       string
	IP       string
	RoomID   string
	Socket   *websocket.Conn
	Nickname string
}

// Service 用户管理服务
type Service struct {
	mu        sync.RWMutex
	users     map[string]map[string]map[string]*User // ip -> roomId -> userId -> User
	idCounter map[string]int                         // ip -> counter
}

// NewService 创建新的服务实例
func NewService() *Service {
	return &Service{
		users:     make(map[string]map[string]map[string]*User),
		idCounter: make(map[string]int),
	}
}

// RegisterUser 注册用户
func (s *Service) RegisterUser(ip, roomID string, conn *websocket.Conn) string {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 初始化 IP 层
	if s.users[ip] == nil {
		s.users[ip] = make(map[string]map[string]*User)
		s.idCounter[ip] = 0
	}

	// 初始化房间层
	if s.users[ip][roomID] == nil {
		s.users[ip][roomID] = make(map[string]*User)
	}

	// 生成用户ID
	s.idCounter[ip]++
	userID := fmt.Sprintf("%d", s.idCounter[ip])

	// 创建用户
	user := &User{
		ID:       userID,
		IP:       ip,
		RoomID:   roomID,
		Socket:   conn,
		Nickname: fmt.Sprintf("用户%s", userID),
	}

	s.users[ip][roomID][userID] = user

	return userID
}

// UnregisterUser 注销用户
func (s *Service) UnregisterUser(ip, roomID, userID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.users[ip] == nil || s.users[ip][roomID] == nil {
		return
	}

	delete(s.users[ip][roomID], userID)

	// 清理空的房间
	if len(s.users[ip][roomID]) == 0 {
		delete(s.users[ip], roomID)
	}

	// 清理空的 IP
	if len(s.users[ip]) == 0 {
		delete(s.users, ip)
		delete(s.idCounter, ip)
	}
}

// GetUser 获取用户
func (s *Service) GetUser(ip, roomID, userID string) *User {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.users[ip] == nil || s.users[ip][roomID] == nil {
		return nil
	}

	return s.users[ip][roomID][userID]
}

// GetUserList 获取房间内的用户列表
func (s *Service) GetUserList(ip, roomID string) []*User {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.users[ip] == nil || s.users[ip][roomID] == nil {
		return []*User{}
	}

	users := make([]*User, 0, len(s.users[ip][roomID]))
	for _, user := range s.users[ip][roomID] {
		users = append(users, user)
	}

	return users
}

// UpdateNickname 更新用户昵称
func (s *Service) UpdateNickname(ip, roomID, userID, nickname string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.users[ip] == nil || s.users[ip][roomID] == nil {
		return false
	}

	user := s.users[ip][roomID][userID]
	if user == nil {
		return false
	}

	user.Nickname = nickname
	return true
}
