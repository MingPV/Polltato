package realtime

// const roomLobby = "lobby"
// const privateRoomPrefix = "private:"

type chatConnState struct {
	privateRoomID string // e.g. "private:my-room", empty if not in a private room
}

// ChatEvent is broadcast on the public lobby.
type ChatEvent struct {
	From string `json:"from"`
	Text string `json:"text"`
	At   int64  `json:"at"`
}

// RoomChatEvent is broadcast inside one private room.
type RoomChatEvent struct {
	From string `json:"from"`
	Text string `json:"text"`
	At   int64  `json:"at"`
	Room string `json:"room"` // slug without "private:" prefix
}

// func truncateForLog(s string, max int) string {
// 	s = strings.TrimSpace(s)
// 	if len(s) <= max {
// 		return s
// 	}
// 	return s[:max] + "…"
// }

// func sanitizeRoomSlug(name string) (slug string, ok bool) {
// 	name = strings.TrimSpace(strings.ToLower(name))
// 	if len(name) == 0 || len(name) > 64 {
// 		return "", false
// 	}
// 	for _, r := range name {
// 		if r == '_' || r == '-' || (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
// 			continue
// 		}
// 		return "", false
// 	}
// 	return name, true
// }

// func getChatState(conn socketio.Conn) *chatConnState {
// 	if v := conn.Context(); v != nil {
// 		if s, ok := v.(*chatConnState); ok {
// 			return s
// 		}
// 	}
// 	s := &chatConnState{}
// 	conn.SetContext(s)
// 	return s
// }

// func parseCORSOrigins() (primary string, all []string) {
// 	raw := os.Getenv("CORS_ORIGIN")
// 	if raw == "" {
// 		raw = "http://localhost:3000"
// 	}
// 	for _, p := range strings.Split(raw, ",") {
// 		p = strings.TrimSpace(p)
// 		if p != "" {
// 			all = append(all, p)
// 		}
// 	}
// 	if len(all) == 0 {
// 		all = []string{"http://localhost:3000"}
// 	}
// 	return all[0], all
// }

// NewChatSocketServer builds Socket.IO: public lobby + joinable private rooms.
// func NewChatSocketServer() *socketio.Server {
// 	primaryOrigin, allowedOrigins := parseCORSOrigins()

// 	wsTransport := &websocket.Transport{
// 		CheckOrigin: func(r *http.Request) bool {
// 			origin := r.Header.Get("Origin")
// 			if origin == "" {
// 				return true
// 			}
// 			for _, a := range allowedOrigins {
// 				if a == origin {
// 					return true
// 				}
// 			}
// 			return false
// 		},
// 	}

// 	opts := &engineio.Options{
// 		RequestChecker: func(*http.Request) (http.Header, error) {
// 			h := http.Header{}
// 			h.Set("Access-Control-Allow-Origin", primaryOrigin)
// 			h.Set("Access-Control-Allow-Credentials", "true")
// 			return h, nil
// 		},
// 		Transports: []transport.Transport{
// 			polling.Default,
// 			wsTransport,
// 		},
// 	}

// 	server := socketio.NewServer(opts)

// 	server.OnConnect("/", func(conn socketio.Conn) error {
// 		conn.Join(roomLobby)
// 		getChatState(conn)
// 		log.Printf("realtime | CONNECT    | socket=%s | client=%s", conn.ID(), conn.RemoteAddr())
// 		return nil
// 	})

// 	server.OnDisconnect("/", func(conn socketio.Conn, reason string) {
// 		log.Printf("realtime | DISCONNECT | socket=%s | reason=%q", conn.ID(), reason)
// 	})

// 	server.OnEvent("/", "join room", func(conn socketio.Conn, roomName string) {
// 		slug, ok := sanitizeRoomSlug(roomName)
// 		if !ok {
// 			conn.Emit("join error", "Use 1–64 characters: letters, digits, _ or -")
// 			return
// 		}
// 		roomID := privateRoomPrefix + slug
// 		st := getChatState(conn)
// 		if st.privateRoomID != "" && st.privateRoomID != roomID {
// 			conn.Leave(st.privateRoomID)
// 		}
// 		conn.Join(roomID)
// 		st.privateRoomID = roomID
// 		log.Printf("realtime | JOIN_ROOM  | socket=%s | room=%q", conn.ID(), slug)
// 		conn.Emit("joined room", slug)
// 	})

// 	server.OnEvent("/", "leave room", func(conn socketio.Conn) {
// 		st := getChatState(conn)
// 		if st.privateRoomID == "" {
// 			conn.Emit("left room", "")
// 			return
// 		}
// 		slug := strings.TrimPrefix(st.privateRoomID, privateRoomPrefix)
// 		conn.Leave(st.privateRoomID)
// 		st.privateRoomID = ""
// 		log.Printf("realtime | LEAVE_ROOM | socket=%s | room=%q", conn.ID(), slug)
// 		conn.Emit("left room", "")
// 	})

// 	server.OnEvent("/", "lobby message", func(conn socketio.Conn, msg string) {
// 		if strings.TrimSpace(msg) == "" {
// 			return
// 		}
// 		log.Printf("realtime | MSG_LOBBY  | socket=%s | text=%q", conn.ID(), truncateForLog(msg, 500))
// 		ev := ChatEvent{From: conn.ID(), Text: msg, At: time.Now().UnixMilli()}
// 		raw, err := json.Marshal(ev)
// 		if err != nil {
// 			log.Printf("realtime | ERROR      | socket=%s | lobby marshal: %v", conn.ID(), err)
// 			return
// 		}
// 		server.BroadcastToRoom("/", roomLobby, "lobby message", string(raw))
// 	})

// 	server.OnEvent("/", "room message", func(conn socketio.Conn, msg string) {
// 		if strings.TrimSpace(msg) == "" {
// 			return
// 		}
// 		st := getChatState(conn)
// 		if st.privateRoomID == "" {
// 			return
// 		}
// 		slug := strings.TrimPrefix(st.privateRoomID, privateRoomPrefix)
// 		log.Printf("realtime | MSG_ROOM   | socket=%s | room=%q | text=%q", conn.ID(), slug, truncateForLog(msg, 500))
// 		ev := RoomChatEvent{
// 			From: conn.ID(),
// 			Text: msg,
// 			At:   time.Now().UnixMilli(),
// 			Room: slug,
// 		}
// 		raw, err := json.Marshal(ev)
// 		if err != nil {
// 			log.Printf("realtime | ERROR      | socket=%s | room marshal: %v", conn.ID(), err)
// 			return
// 		}
// 		server.BroadcastToRoom("/", st.privateRoomID, "room message", string(raw))
// 	})

// 	return server
// }
