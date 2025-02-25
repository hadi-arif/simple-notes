import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ChakraProvider, Box, Heading } from "@chakra-ui/react";

function Home() {
  return (
    <Box textAlign="center" p={5} bg="red.500" color="white" minH="100vh">
      <Heading>Catatan Harian</Heading>
    </Box>
  );
}

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
