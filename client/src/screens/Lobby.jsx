import React, { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import styled from "styled-components";
import logo from "../assets/logo (2).png"; // Update with the correct path to your logo image
import sideImage from "../assets/face.png"; // Add path to your new image

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
      console.log({
        email,
        room,
      });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`);
  }, [navigate]);

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <Container>
      <SideImage src={sideImage} alt="Side Image" />
      <FormContainer>
        <Logo src={logo} alt="Logo" />
        <Form onSubmit={handleSubmitForm}>
          <Label htmlFor="email">Email ID</Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Label htmlFor="room">Room Number</Label>
          <Input
            type="text"
            id="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <Button type="submit">Join</Button>
        </Form>
      </FormContainer>
    </Container>
  );
};

export default LobbyScreen;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f3e5f5;
  color: #4a148c;
  font-family: 'Roboto', sans-serif;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
  }
`;

const SideImage = styled.img`
  width: 500px; // Adjust width as needed
  height: auto;
  margin-right: 3rem; // Space between the image and the form

  @media (max-width: 768px) {
    width: 100%;
    margin-right: 0;
    margin-bottom: 2rem;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled.img`
  margin-top: 10px;
  width: 300px;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    width: 200px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    width: 100%;
    padding: 1rem;
  }
`;

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  align-self: flex-start;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #4a148c;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
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
    background-color: #4a148c;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.5rem;
  }
`;
