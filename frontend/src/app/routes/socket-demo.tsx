import { FormEvent, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

import { ContentLayout } from '@/components/layouts/content-layout';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';

type ChatPayload = {
  from: string;
  text: string;
  at: number;
};

type RoomChatPayload = ChatPayload & { room: string };

type ChatLine = ChatPayload & { id: string };

type RoomChatLine = RoomChatPayload & { id: string };

function appendLine<T extends ChatPayload>(
  prev: (T & { id: string })[],
  payload: T,
): (T & { id: string })[] {
  return [
    ...prev,
    {
      ...payload,
      id: `${payload.at}-${payload.from}-${Math.random().toString(36).slice(2, 9)}`,
    },
  ];
}

const SocketDemoRoute = () => {
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState<string>('');
  const [lobbyLines, setLobbyLines] = useState<ChatLine[]>([]);
  const [privateLines, setPrivateLines] = useState<RoomChatLine[]>([]);
  const [lobbyDraft, setLobbyDraft] = useState('');
  const [privateDraft, setPrivateDraft] = useState('');
  const [roomNameDraft, setRoomNameDraft] = useState('');
  const [activePrivateRoom, setActivePrivateRoom] = useState<string | null>(
    null,
  );
  const [joinError, setJoinError] = useState<string | null>(null);

  const lobbyListRef = useRef<HTMLUListElement>(null);
  const privateListRef = useRef<HTMLUListElement>(null);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);

  useEffect(() => {
    const socket = io(env.SOCKET_URL, {
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      upgrade: false,
    });
    socketRef.current = socket;

    function onConnect() {
      setConnected(true);
      const engine = (
        socket as { io?: { engine?: { transport?: { name?: string } } } }
      ).io?.engine?.transport?.name;
      setTransport(engine ?? 'connected');
    }

    function onDisconnect() {
      setConnected(false);
      setTransport('');
      setActivePrivateRoom(null);
      setPrivateLines([]);
      setJoinError(null);
    }

    function onLobbyMessage(raw: string) {
      let payload: ChatPayload;
      try {
        payload = JSON.parse(raw) as ChatPayload;
      } catch {
        return;
      }
      if (!payload?.from || typeof payload.text !== 'string') {
        return;
      }
      setLobbyLines((prev) => appendLine(prev, payload));
    }

    function onRoomMessage(raw: string) {
      let payload: RoomChatPayload;
      try {
        payload = JSON.parse(raw) as RoomChatPayload;
      } catch {
        return;
      }
      if (
        !payload?.from ||
        typeof payload.text !== 'string' ||
        typeof payload.room !== 'string'
      ) {
        return;
      }
      setPrivateLines((prev) => appendLine(prev, payload));
    }

    function onJoinedRoom(slug: string) {
      setActivePrivateRoom(slug);
      setJoinError(null);
      setPrivateLines([]);
    }

    function onJoinError(reason: string) {
      setJoinError(typeof reason === 'string' ? reason : 'Could not join room');
    }

    function onLeftRoom() {
      setActivePrivateRoom(null);
      setPrivateLines([]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('lobby message', onLobbyMessage);
    socket.on('room message', onRoomMessage);
    socket.on('joined room', onJoinedRoom);
    socket.on('join error', onJoinError);
    socket.on('left room', onLeftRoom);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('lobby message', onLobbyMessage);
      socket.off('room message', onRoomMessage);
      socket.off('joined room', onJoinedRoom);
      socket.off('join error', onJoinError);
      socket.off('left room', onLeftRoom);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    lobbyListRef.current?.lastElementChild?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [lobbyLines]);

  useEffect(() => {
    privateListRef.current?.lastElementChild?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [privateLines]);

  function sendLobby(e: FormEvent) {
    e.preventDefault();
    const text = lobbyDraft.trim();
    if (!text || !socketRef.current) {
      return;
    }
    socketRef.current.emit('lobby message', text);
    setLobbyDraft('');
  }

  function sendPrivate(e: FormEvent) {
    e.preventDefault();
    const text = privateDraft.trim();
    if (!text || !socketRef.current || !activePrivateRoom) {
      return;
    }
    socketRef.current.emit('room message', text);
    setPrivateDraft('');
  }

  function joinRoom(e: FormEvent) {
    e.preventDefault();
    const name = roomNameDraft.trim().toLowerCase();
    if (!name || !socketRef.current) {
      return;
    }
    setJoinError(null);
    socketRef.current.emit('join room', name);
  }

  function leaveRoom() {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.emit('leave room');
  }

  return (
    <ContentLayout title="Socket.IO demo">
      <div className="mx-auto max-w-5xl space-y-6">
        <p className="text-sm text-muted-foreground">
          Connects to{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {env.SOCKET_URL}
          </code>
          . <strong>Public lobby</strong> is open to everyone.{' '}
          <strong>Private room</strong>: pick a room name (letters, digits,{' '}
          <code className="text-xs">_</code>, <code className="text-xs">-</code>
          ), join, and only members of that room see those messages. Server:{' '}
          <a
            className="text-primary underline"
            href="https://github.com/googollee/go-socket.io"
            target="_blank"
            rel="noreferrer"
          >
            go-socket.io
          </a>
          , client 1.x, polling only.
        </p>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-block size-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
            aria-hidden
          />
          <span className="font-medium text-gray-900">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          {transport ? (
            <span className="text-muted-foreground">({transport})</span>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Public lobby */}
          <section className="space-y-3 rounded-lg border border-input bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Public lobby
            </h2>
            <p className="text-xs text-muted-foreground">
              Visible to everyone connected.
            </p>
            <ul
              ref={lobbyListRef}
              className="h-64 overflow-y-auto rounded-md border border-border/80 bg-background p-3 text-sm"
              aria-live="polite"
            >
              {lobbyLines.length === 0 ? (
                <li className="text-muted-foreground">
                  No lobby messages yet.
                </li>
              ) : (
                lobbyLines.map((line) => (
                  <li
                    key={line.id}
                    className="border-b border-border/50 py-2 last:border-0"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {line.from.slice(0, 8)}…
                    </span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-gray-900">{line.text}</span>
                  </li>
                ))
              )}
            </ul>
            <form onSubmit={sendLobby} className="flex gap-2">
              <input
                type="text"
                value={lobbyDraft}
                onChange={(ev) => setLobbyDraft(ev.target.value)}
                placeholder="Message to lobby"
                className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={2000}
                autoComplete="off"
                aria-label="Lobby message"
              />
              <Button type="submit" disabled={!connected || !lobbyDraft.trim()}>
                Send
              </Button>
            </form>
          </section>

          {/* Private room */}
          <section className="space-y-3 rounded-lg border border-input bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Private room
            </h2>
            <form onSubmit={joinRoom} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={roomNameDraft}
                onChange={(ev) => setRoomNameDraft(ev.target.value)}
                placeholder="room-name"
                className="h-9 min-w-40 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={64}
                autoComplete="off"
                aria-label="Room name"
                disabled={!connected}
              />
              <Button
                type="submit"
                disabled={!connected || !roomNameDraft.trim()}
              >
                Join
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!connected || !activePrivateRoom}
                onClick={leaveRoom}
              >
                Leave
              </Button>
            </form>
            {joinError ? (
              <p className="text-sm text-destructive" role="alert">
                {joinError}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {activePrivateRoom ? (
                <>
                  In room{' '}
                  <code className="rounded bg-muted px-1 py-0.5">
                    {activePrivateRoom}
                  </code>
                </>
              ) : (
                'Join a room to send private messages.'
              )}
            </p>
            <ul
              ref={privateListRef}
              className="h-52 overflow-y-auto rounded-md border border-border/80 bg-background p-3 text-sm"
              aria-live="polite"
            >
              {privateLines.length === 0 ? (
                <li className="text-muted-foreground">
                  {activePrivateRoom
                    ? 'No messages in this room yet.'
                    : 'Join a room to see messages here.'}
                </li>
              ) : (
                privateLines.map((line) => (
                  <li
                    key={line.id}
                    className="border-b border-border/50 py-2 last:border-0"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {line.from.slice(0, 8)}…
                    </span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-gray-900">{line.text}</span>
                  </li>
                ))
              )}
            </ul>
            <form onSubmit={sendPrivate} className="flex gap-2">
              <input
                type="text"
                value={privateDraft}
                onChange={(ev) => setPrivateDraft(ev.target.value)}
                placeholder={
                  activePrivateRoom
                    ? `Message #${activePrivateRoom}`
                    : 'Join a room first'
                }
                className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={2000}
                autoComplete="off"
                aria-label="Private room message"
              />
              <Button
                type="submit"
                disabled={
                  !connected || !activePrivateRoom || !privateDraft.trim()
                }
              >
                Send
              </Button>
            </form>
          </section>
        </div>
      </div>
    </ContentLayout>
  );
};

export default SocketDemoRoute;
