package realtime

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	socketio "github.com/googollee/go-socket.io"
	"github.com/googollee/go-socket.io/engineio"
	"github.com/googollee/go-socket.io/engineio/transport"
	"github.com/googollee/go-socket.io/engineio/transport/polling"
	"github.com/googollee/go-socket.io/engineio/transport/websocket"
)

const (
	roomLobby         = "lobby"
	privateRoomPrefix = "private:"
)

type pollConnState struct {
	pollRoomID string // e.g. "private:room-id"
}

type PollUpdateType string

const (
	PollTypeAddVote      PollUpdateType = "add-vote"
	PollTypeAddChoice    PollUpdateType = "add-choice"
	PollTypeDeleteChoice PollUpdateType = "delete-choice"
	PollTypeResetPoll    PollUpdateType = "reset-poll"
	PollTypeUpdatePoll   PollUpdateType = "update-poll"
	PollTypeDeletePoll   PollUpdateType = "delete-poll"
)

type PollUpdateEvent struct {
	From    string         `json:"from"`
	RoomID  string         `json:"room_id"`
	Type    PollUpdateType `json:"type"`
	Version int64          `json:"version"`
	Data    PollData       `json:"data"`
}

type PollData struct {
	ID         uint                 `json:"id"`
	PollName   string               `json:"poll_name"`
	IsMulti    bool                 `json:"is_multi"`
	RoomID     string               `json:"room_id"`
	Choices    []PollChoiceResponse `json:"choices"`
	UpdateTime time.Time            `json:"update_time"`
}

type PollChoiceResponse struct {
	ID         uint   `json:"id"`
	ChoiceName string `json:"choice_name"`
	NumberVote int    `json:"number_vote"`
}

func getPollState(conn socketio.Conn) *pollConnState {
	if v := conn.Context(); v != nil {
		if s, ok := v.(*pollConnState); ok {
			return s
		}
	}
	s := &pollConnState{}
	conn.SetContext(s)
	return s
}

func parseCORSOrigins() (primary string, all []string) {
	raw := os.Getenv("CORS_ORIGIN")
	if raw == "" {
		raw = "http://localhost:3000,http://localhost:5173,http://localhost:5500,http://127.0.0.1:5500"
	}
	for _, p := range strings.Split(raw, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			all = append(all, p)
		}
	}
	if len(all) == 0 {
		all = []string{"http://localhost:3000"}
	}
	return all[0], all
}

func NewPollSocketServer() *socketio.Server {
	primaryOrigin, allowedOrigins := parseCORSOrigins()

	wsTransport := &websocket.Transport{
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true
			}
			for _, a := range allowedOrigins {
				if a == origin {
					return true
				}
			}
			return false
		},
	}

	opts := &engineio.Options{
		RequestChecker: func(r *http.Request) (http.Header, error) {
			h := http.Header{}
			origin := r.Header.Get("Origin")
			if origin != "" {
				// Search if allowed
				allowed := false
				for _, a := range allowedOrigins {
					if a == origin {
						allowed = true
						break
					}
				}
				if allowed {
					h.Set("Access-Control-Allow-Origin", origin)
				} else {
					h.Set("Access-Control-Allow-Origin", primaryOrigin)
				}
			} else {
				h.Set("Access-Control-Allow-Origin", primaryOrigin)
			}
			h.Set("Access-Control-Allow-Credentials", "true")
			return h, nil
		},
		Transports: []transport.Transport{
			polling.Default,
			wsTransport,
		},
	}

	server := socketio.NewServer(opts)

	server.OnConnect("/", func(conn socketio.Conn) error {
		getPollState(conn)
		log.Printf("realtime | CONNECT    | socket=%s | client=%s", conn.ID(), conn.RemoteAddr())
		return nil
	})

	server.OnDisconnect("/", func(conn socketio.Conn, reason string) {
		log.Printf("realtime | DISCONNECT | socket=%s | reason=%q", conn.ID(), reason)
	})

	// ใน Poll App เราจะรับแค่ room_id (UUID)
	server.OnEvent("/", "join-room", func(conn socketio.Conn, roomID string) {
		if strings.TrimSpace(roomID) == "" {
			return
		}

		fullRoomID := privateRoomPrefix + roomID
		st := getPollState(conn)

		// ถ้าเคยอยู่ในห้องอื่น ให้เอาออกก่อน
		if st.pollRoomID != "" && st.pollRoomID != fullRoomID {
			conn.Leave(st.pollRoomID)
		}

		conn.Join(fullRoomID)
		st.pollRoomID = fullRoomID

		log.Printf("realtime | JOIN_ROOM  | socket=%s | room=%q", conn.ID(), roomID)
		conn.Emit("joined-room", roomID)
	})

	// Comment ไว้ตามที่คุยกันครับ: ให้ Server เป็นคนส่ง update-poll ไปหาหน้าบ้านฝ่ายเดียว
	/*
		server.OnEvent("/", "update-poll", func(conn socketio.Conn, msg PollUpdateEvent) {
			st := getPollState(conn)
			if st.pollRoomID == "" {
				return
			}

			log.Printf("realtime | MSG_UPDATE  | socket=%s | type=%q | room=%q", conn.ID(), msg.Type, st.pollRoomID)

			// Broadcast ต่อไปให้ทุกคนในห้องเดียวกันเห็น
			server.BroadcastToRoom("/", st.pollRoomID, "update-poll", msg)
		})
	*/

	return server
}

func BroadcastPollUpdate(server *socketio.Server, roomID string, event PollUpdateEvent) {
	fullRoomID := privateRoomPrefix + roomID
	log.Printf("realtime | BROADCAST   | type=%q | room=%q", event.Type, fullRoomID)
	log.Printf("realtime | BROADCAST   | event=%+v", event)
	server.BroadcastToRoom("/", fullRoomID, "update-poll", event)
}

func BroadcastPollDelete(server *socketio.Server, roomID string, pollName string) {
	fullRoomID := privateRoomPrefix + roomID
	payload := map[string]string{
		"room_id": roomID,
		"name":    pollName,
	}
	log.Printf("realtime | BROADCAST   | type=delete-poll | room=%q", fullRoomID)
	server.BroadcastToRoom("/", fullRoomID, "delete-poll", payload)
}
