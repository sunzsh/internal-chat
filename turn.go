package main

import (
	"log"
	"net"
	"regexp"
	"strconv"

	"github.com/pion/turn/v4"
)

func startTURN(publicIP *string, port *int, users *string) {
	if len(*publicIP) == 0 {
		log.Fatalf("'public-ip' is required")
	} else if len(*users) == 0 {
		log.Fatalf("'users' is required")
	}
	udpListener, err := net.ListenPacket("udp", "0.0.0.0:"+strconv.Itoa(*port))
	if err != nil {
		log.Panicf("Failed to create TURN server listener: %s", err)
	}
	usersMap := map[string][]byte{}
	for _, kv := range regexp.MustCompile(`(\w+)=(\w+)`).FindAllStringSubmatch(*users, -1) {
		log.Printf("Adding TURN user: %s", kv[1])
		usersMap[kv[1]] = turn.GenerateAuthKey(kv[1], "internal-chat", kv[2])
	}

	_, err = turn.NewServer(turn.ServerConfig{
		Realm: "internal-chat",
		AuthHandler: func(username string, realm string, srcAddr net.Addr) ([]byte, bool) { // nolint: revive
			if key, ok := usersMap[username]; ok {
				return key, true
			}

			return nil, false
		},
		PacketConnConfigs: []turn.PacketConnConfig{
			{
				PacketConn: udpListener,
				RelayAddressGenerator: &turn.RelayAddressGeneratorStatic{
					RelayAddress: net.ParseIP(*publicIP),
					Address:      "0.0.0.0",
				},
			},
		},
	})
	if err != nil {
		log.Panic(err)
	}
}
