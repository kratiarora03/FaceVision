import React, { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from 'react-player';
import peer from "../service/peer";
import styled from 'styled-components';
import logo from "../assets/logo (2).png";

const RoomPage = () => {
    const socket = useSocket();
    const navigate = useNavigate(); // Initialize navigate
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callConnected, setCallConnected] = useState(false);

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        setMyStream(stream);
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
    }, [remoteSocketId, socket]);

    const handleIncomingCall = useCallback(async ({ from, offer }) => {
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        setMyStream(stream);
        const ans = await peer.getAnswer(offer);
        socket.emit('call:accepted', { to: from, ans });
        sendStreams();
        setCallConnected(true);
    }, [socket]);

    const sendStreams = useCallback(() => {
        if (myStream) {
            for (const track of myStream.getTracks()) {
                peer.peer.addTrack(track, myStream);
            }
        }
    }, [myStream]);

    const handleCallAccepted = useCallback(async ({ from, ans }) => {
        await peer.setLocalDescription(ans);
        sendStreams();
        setCallConnected(true);
    }, [myStream, sendStreams]);

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed', { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    const handleNegoNeedIncoming = useCallback(async ({ from, offer }) => {
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", { to: from, answer: ans });
    }, [socket]);

    const handleNegoNeedFinal = useCallback(async ({ answer }) => {
        await peer.setLocalDescription(answer);
    }, []);

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
        }
    }, [handleNegoNeeded]);

    useEffect(() => {
        peer.peer.addEventListener('track', (ev) => {
            const [remoteStream] = ev.streams;
            setRemoteStream(remoteStream);
        });
    }, []);

    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on('incoming:call', handleIncomingCall);
        socket.on('call:accepted', handleCallAccepted);
        socket.on('peer:nego:needed', handleNegoNeedIncoming);
        socket.on('peer:nego:final', handleNegoNeedFinal);
        return () => {
            socket.off('user:joined', handleUserJoined);
            socket.off('incoming:call', handleIncomingCall);
            socket.off('call:accepted', handleCallAccepted);
            socket.off('peer:nego:needed', handleNegoNeedIncoming);
            socket.off('peer:nego:final', handleNegoNeedFinal);
        };
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoNeedIncoming, handleNegoNeedFinal]);

    const handleEndCall = useCallback(() => {
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
            setMyStream(null);
        }
        if (remoteStream) {
            setRemoteStream(null);
        }
        setCallConnected(false);
        navigate('/'); // Redirect to lobby
    }, [myStream, remoteStream, navigate]);

    return (
        <Container>
            {!callConnected && (
                <>
                    <Logo src={logo} alt="Logo" />
                    <Header>Welcome to Face Vision</Header>
                </>
            )}
            <Status>{remoteSocketId ? 'Connected' : 'No one in the room'}</Status>
            <ButtonContainer>
                {myStream && <Button onClick={sendStreams}>Send Stream</Button>}
                {remoteSocketId && <Button onClick={handleCallUser}>Call</Button>}
                {callConnected && <Button onClick={handleEndCall}>End Call</Button>} {/* End Call Button */}
            </ButtonContainer>
            <VideoContainer>
                {myStream && <StyledReactPlayer playing muted height="300px" width="500px" url={myStream} />}
                {remoteStream && <StyledReactPlayer playing muted height="300px" width="500px" url={remoteStream} />}
            </VideoContainer>
        </Container>
    );
};

export default RoomPage;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #6a1b9a; /* Lighter purple background */
    color: #ffffff;
    font-family: 'Roboto', sans-serif;

    @media (max-width: 768px) {
        padding: 1rem;
    }
`;

const Logo = styled.img`
    width: 150px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
        width: 120px;
    }
`;

const Header = styled.h1`
    font-size: 2.5rem;
    margin-bottom: 1rem;

    @media (max-width: 768px) {
        font-size: 2rem;
        text-align: center;
    }
`;

const Status = styled.h4`
    font-size: 1.2rem;
    margin-bottom: 2rem;

    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

const ButtonContainer = styled.div`
    margin-bottom: 2rem;

    @media (max-width: 768px) {
        button {
            margin: 0.5rem 0;
        }
    }
`;

const Button = styled.button`
    padding: 0.5rem 1rem;
    font-size: 1rem;
    color: #ffffff;
    background-color: #7b1fa2;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    &:hover {
        background-color: #4a145c;
    }

    @media (max-width: 768px) {
        width: 100%;
        padding: 0.5rem;
    }
`;

const VideoContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 2rem;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 1rem;
    }
`;

const StyledReactPlayer = styled(ReactPlayer)`
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    overflow: hidden;

    @media (max-width: 768px) {
        width: 100%;
        height: auto;
    }
`;
