import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

function InputPage() {
  const [scriptText, setScriptText] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    localStorage.setItem('teleprompterText', scriptText);
    navigate('/prompter');
  };

  return (
    <Container maxWidth="md" className="pt-8 md:pt-16 flex flex-col items-center min-h-screen bg-gray-100">
      <Box component="form" noValidate autoComplete="off" className="w-full bg-white p-6 rounded shadow-md">
         <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            Enter Your Script
         </h1>
         <TextField
            id="script-input"
            label="Script Text"
            multiline
            rows={20}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            variant="outlined"
            fullWidth
            placeholder="Paste or type your script here..."
            className="mb-4"
         />
         <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-300 ease-in-out"
         >
            Start Prompter
         </Button>
      </Box>
    </Container>
  );
}

export default InputPage;