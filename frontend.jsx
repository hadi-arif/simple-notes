import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ChakraProvider, Box, Flex, Heading, Button, useToast } from "@chakra-ui/react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import NoteDetail from "./pages/NoteDetail";
import { useState, useEffect } from "react";
import axios from "axios";

const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post("http://localhost:8080/login", credentials);
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      toast({ title: "Login successful", status: "success", duration: 3000, isClosable: true });
      navigate("/notes");
    } catch (error) {
      toast({ title: "Login failed", description: error.response?.data?.message || "An error occurred", status: "error", duration: 3000, isClosable: true });
    }
  };

  const handleRegister = async (credentials) => {
    try {
      await axios.post("http://localhost:8080/register", credentials);
      toast({ title: "Registration successful", description: "Please login", status: "success", duration: 3000, isClosable: true });
      navigate("/login");
    } catch (error) {
      toast({ title: "Registration failed", description: error.response?.data?.message || "An error occurred", status: "error", duration: 3000, isClosable: true });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    toast({ title: "Logged out successfully", status: "info", duration: 3000, isClosable: true });
    navigate("/login");
  };

  return (
    <ChakraProvider>
      <Router>
        <Flex minH="100vh" direction="column" align="center" justify="center" bg="gray.100">
          <Box p={4} w="full" maxW="md" bg="white" boxShadow="lg" borderRadius="md">
            <Heading textAlign="center" mb={6}>Notes App</Heading>
            <Button onClick={handleLogout} colorScheme="red" mb={4}>Logout</Button>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onRegister={handleRegister} />} />
              <Route path="/notes" element={<PrivateRoute element={<Notes />} />} />
              <Route path="/notes/:id" element={<PrivateRoute element={<NoteDetail />} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
        </Flex>
      </Router>
    </ChakraProvider>
  );
}

export default App;
