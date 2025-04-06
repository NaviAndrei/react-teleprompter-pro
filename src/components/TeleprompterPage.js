import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useNavigate } from 'react-router-dom';
// import { MuiColorInput } from 'mui-color-input' // Example if using a third-party color picker

function TeleprompterPage() {
  const navigate = useNavigate();
  
  // Instead of a plain string, we'll store formatted text segments
  const [textSegments, setTextSegments] = useState([]);
  const [selection, setSelection] = useState({ start: -1, end: -1 });
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [isScrolling, setIsScrolling] = useState(false);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(48);
  const [textAlign, setTextAlign] = useState('left');
  
  // Default formatting state for new text
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderlined, setIsUnderlined] = useState(false);
  
  const prompterRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  // Load text and convert to formatted segments
  useEffect(() => {
    const storedText = localStorage.getItem('teleprompterText');
    const initialText = storedText || 'Welcome to the Teleprompter! Paste your text on the previous page.';
    
    // Create initial text segment with default formatting
    setTextSegments([{
      text: initialText,
      isBold: false,
      isItalic: false,
      isUnderlined: false,
      color: '#FFFFFF'
    }]);
  }, []);

  // Add wheel event handler for mouse scroll
  useEffect(() => {
    const handleWheel = (event) => {
      if (prompterRef.current) {
        // Scroll faster based on delta (multiplier makes scrolling more noticeable)
        prompterRef.current.scrollTop += event.deltaY * 0.5;
      }
    };

    // Get the prompter element and add wheel event listener
    const prompterElement = prompterRef.current;
    if (prompterElement) {
      prompterElement.addEventListener('wheel', handleWheel);
    }

    // Clean up the event listener when component unmounts
    return () => {
      if (prompterElement) {
        prompterElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  useEffect(() => {
    if (isScrolling) {
      scrollIntervalRef.current = setInterval(() => {
        if (prompterRef.current) {
          prompterRef.current.scrollTop += 1; // Scroll down by 1px
        }
      }, 100 / scrollSpeed); // Adjust interval based on scroll speed
    } else {
      clearInterval(scrollIntervalRef.current);
    }

    // Cleanup interval on unmount
    return () => clearInterval(scrollIntervalRef.current);
  }, [isScrolling, scrollSpeed]);

  const toggleScrolling = () => setIsScrolling(!isScrolling);

  // Handle text selection or cursor position
  const handleTextSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection();
      
      try {
        // Get the selection range from the DOM
        const range = sel.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(prompterRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;
        
        if (sel.toString().length > 0) {
          // Handle selection
          const end = start + range.toString().length;
          setSelection({ start, end });
          // Update the formatting state based on the selected text
          updateFormattingState(start, end);
        } else {
          // Handle cursor position only (no selection)
          setSelection({ start: -1, end: -1 });
          // Still update formatting state based on cursor position
          updateFormattingAtPosition(start);
        }
      } catch (error) {
        console.error("Selection error:", error);
        setSelection({ start: -1, end: -1 });
      }
    }
  };

  // Update formatting state based on cursor position
  const updateFormattingAtPosition = (position) => {
    if (textSegments.length === 0) return;
    
    let currentPos = 0;
    for (const segment of textSegments) {
      const segmentLength = segment.text.length;
      const segmentEnd = currentPos + segmentLength;
      
      // Check if cursor is within this segment
      if (currentPos <= position && position <= segmentEnd) {
        setIsBold(segment.isBold || false);
        setIsItalic(segment.isItalic || false);
        setIsUnderlined(segment.isUnderlined || false);
        if (segment.color) {
          setTextColor(segment.color);
        }
        return;
      }
      
      currentPos += segmentLength;
    }
  };

  // Handle click inside the text container (for cursor position without selection)
  const handleClick = () => {
    // Use setTimeout to let the selection/cursor position update first
    setTimeout(handleTextSelection, 0);
  };

  // Also handle keyup events to update formatting when moving cursor with keyboard
  const handleKeyUp = (e) => {
    // Only handle arrow keys and other navigation keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      handleTextSelection();
    }
  };

  // Update the formatting state based on the first character of the selection
  const updateFormattingState = (start, end) => {
    if (start === -1 || textSegments.length === 0) return;
    
    let currentPos = 0;
    for (const segment of textSegments) {
      const segmentLength = segment.text.length;
      const segmentEnd = currentPos + segmentLength;
      
      // Check if selection starts within this segment
      if (currentPos <= start && start < segmentEnd) {
        setIsBold(segment.isBold || false);
        setIsItalic(segment.isItalic || false);
        setIsUnderlined(segment.isUnderlined || false);
        if (segment.color) {
          setTextColor(segment.color);
        }
        return;
      }
      
      currentPos += segmentLength;
    }
  };

  // Apply formatting to selected text
  const applyFormatting = (formatType, value) => {
    if (selection.start === -1 || selection.end === -1) {
      // If no selection, update the default formatting state
      if (formatType === 'bold') setIsBold(value);
      if (formatType === 'italic') setIsItalic(value);
      if (formatType === 'underline') setIsUnderlined(value);
      if (formatType === 'color') setTextColor(value);
      return;
    }
    
    let currentPos = 0;
    let newSegments = [];
    
    // Process each segment and split as needed
    for (const segment of textSegments) {
      const segmentLength = segment.text.length;
      const segmentEnd = currentPos + segmentLength;
      
      // Case 1: Segment is entirely before selection
      if (segmentEnd <= selection.start) {
        newSegments.push(segment);
      }
      // Case 2: Segment is entirely after selection
      else if (currentPos >= selection.end) {
        newSegments.push(segment);
      }
      // Case 3: Segment overlaps with selection
      else {
        // Add part before selection
        if (currentPos < selection.start) {
          newSegments.push({
            ...segment,
            text: segment.text.substring(0, selection.start - currentPos)
          });
        }
        
        // Add the selected part with new formatting
        const selectedStart = Math.max(0, selection.start - currentPos);
        const selectedEnd = Math.min(segmentLength, selection.end - currentPos);
        const selectedText = segment.text.substring(selectedStart, selectedEnd);
        
        if (selectedText) {
          const newSegment = { ...segment, text: selectedText };
          
          // Apply the specific formatting
          if (formatType === 'bold') newSegment.isBold = value;
          else if (formatType === 'italic') newSegment.isItalic = value;
          else if (formatType === 'underline') newSegment.isUnderlined = value;
          else if (formatType === 'color') newSegment.color = value;
          
          newSegments.push(newSegment);
        }
        
        // Add part after selection
        if (segmentEnd > selection.end) {
          newSegments.push({
            ...segment,
            text: segment.text.substring(selection.end - currentPos)
          });
        }
      }
      
      currentPos += segmentLength;
    }
    
    setTextSegments(newSegments);
    window.getSelection().removeAllRanges(); // Clear browser selection
    setSelection({ start: -1, end: -1 }); // Clear selection after applying
  };

  // Toggle formatting buttons handlers
  const toggleBold = () => {
    const newValue = selection.start !== -1 ? !isBold : !isBold;
    applyFormatting('bold', newValue);
  };
  
  const toggleItalic = () => {
    const newValue = selection.start !== -1 ? !isItalic : !isItalic;
    applyFormatting('italic', newValue);
  };
  
  const toggleUnderline = () => {
    const newValue = selection.start !== -1 ? !isUnderlined : !isUnderlined;
    applyFormatting('underline', newValue);
  };

  const applyTextColor = (color) => applyFormatting('color', color);

  const pageStyles = {
    backgroundColor: backgroundColor,
  };

  const handleGoBack = () => {
    navigate('/'); // Navigate to the root path
  };

  // Merge adjacent segments with identical formatting to optimize
  const mergeSegments = () => {
    if (textSegments.length <= 1) return;
    
    const merged = [textSegments[0]];
    
    for (let i = 1; i < textSegments.length; i++) {
      const current = textSegments[i];
      const previous = merged[merged.length - 1];
      
      // Check if formatting is identical
      if (
        previous.isBold === current.isBold &&
        previous.isItalic === current.isItalic &&
        previous.isUnderlined === current.isUnderlined &&
        previous.color === current.color
      ) {
        // Merge by combining text
        merged[merged.length - 1] = {
          ...previous,
          text: previous.text + current.text
        };
      } else {
        merged.push(current);
      }
    }
    
    setTextSegments(merged);
  };

  // Call merge when no selection is active and textSegments have changed
  useEffect(() => {
    if (selection.start === -1 && selection.end === -1) {
      mergeSegments();
    }
  }, [selection, textSegments]);

  return (
    // Main container: Full height, overflow hidden, relative positioning
    <Box className="h-screen overflow-hidden relative" style={pageStyles}>

      {/* Scrollable Text Area */}
      <Box
        ref={prompterRef}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        tabIndex={0} // Make div focusable for keyboard events
        // Height calculated minus control area, hidden overflow, padding, line height, text wrap
        className={`h-[calc(100vh-80px)] overflow-y-hidden p-6 leading-relaxed whitespace-pre-wrap font-sans text-${textAlign}`}
        style={{ backgroundColor, fontSize: `${fontSize}px` }}
      >
        {/* Render formatted text segments */}
        {textSegments.map((segment, index) => (
          <span
            key={index}
            style={{
              fontWeight: segment.isBold ? 'bold' : 'normal',
              fontStyle: segment.isItalic ? 'italic' : 'normal',
              textDecoration: segment.isUnderlined ? 'underline' : 'none',
              color: segment.color || textColor,
            }}
          >
            {segment.text}
          </span>
        ))}
      </Box>

      {/* Controls Area */}
      <Box
        // Fixed position at bottom, full width, semi-transparent background, padding, high z-index
        className="fixed bottom-0 left-0 w-full bg-gray-800 bg-opacity-80 p-4 z-10"
      >
        {/* Using Stack for layout, but applying flex properties via Tailwind for centering and spacing */}
        <Stack
          direction="row"
          spacing={2} // MUI spacing can still be useful here
          alignItems="center"
          justifyContent="center"
          flexWrap="wrap"
          className="gap-4" // Added Tailwind gap for responsive spacing if wrapping occurs
        >
          {/* Back Button (Added) */}
          <Button
            variant="outlined" // Use outlined or another variant for distinction
            onClick={handleGoBack}
            // Styling for the back button
            className="text-white border-white hover:bg-gray-700 hover:border-gray-300 font-medium py-2 px-4 rounded"
          >
            Back
          </Button>

          {/* Play/Pause Button */}
          <Button
            variant="contained" // Keep MUI variant
            startIcon={isScrolling ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={toggleScrolling}
            // Basic button styling with Tailwind, leveraging MUI's base styles
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            {isScrolling ? 'Pause' : 'Play'}
          </Button>

          {/* Speed Slider Container */}
          <Box className="min-w-[150px] flex items-center text-white">
            <Typography component="span" className="mr-2">Speed:</Typography>
            <Slider
              value={scrollSpeed}
              onChange={(e, newValue) => setScrollSpeed(newValue)}
              aria-labelledby="speed-slider"
              valueLabelDisplay="auto"
              step={0.5}
              min={0.5}
              max={10}
              // Styling slider directly might still require sx or theme overrides
              sx={{ color: 'white', flexGrow: 1 }}
            />
          </Box>

          {/* Font Size Slider Container */}
          <Box className="min-w-[150px] flex items-center text-white">
            <Typography component="span" className="mr-2">Font Size:</Typography>
            <Slider
                value={fontSize}
                onChange={(e, newValue) => setFontSize(newValue)}
                aria-labelledby="font-size-slider"
                valueLabelDisplay="auto"
                step={2}
                min={16}
                max={120}
                sx={{ color: 'white', flexGrow: 1 }} // Keep sx for slider color
             />
          </Box>

          {/* Text Alignment Controls (Added) */}
          <ButtonGroup variant="outlined" aria-label="text alignment group">
            <Button
              onClick={() => setTextAlign('left')}
              className={`px-3 py-1 ${textAlign === 'left' ? 'bg-gray-600 text-white' : 'text-gray-300 border-gray-500 hover:bg-gray-700'}`}
              sx={{ textTransform: 'none' }}
            >
              Left
            </Button>
            <Button
              onClick={() => setTextAlign('center')}
              className={`px-3 py-1 ${textAlign === 'center' ? 'bg-gray-600 text-white' : 'text-gray-300 border-gray-500 hover:bg-gray-700'}`}
               sx={{ textTransform: 'none' }}
            >
              Center
            </Button>
            <Button
              onClick={() => setTextAlign('right')}
              className={`px-3 py-1 ${textAlign === 'right' ? 'bg-gray-600 text-white' : 'text-gray-300 border-gray-500 hover:bg-gray-700'}`}
               sx={{ textTransform: 'none' }}
            >
              Right
            </Button>
          </ButtonGroup>

          {/* Text Formatting Controls */}
          <ButtonGroup variant="outlined" aria-label="text formatting group">
            <Button
              onClick={toggleBold}
              className={`px-3 py-1 ${isBold ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-500 hover:bg-gray-700'}`}
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
              title="Bold"
            >
              B
            </Button>
            <Button
              onClick={toggleItalic}
              className={`px-3 py-1 ${isItalic ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-500 hover:bg-gray-700'}`}
              sx={{ textTransform: 'none', fontStyle: 'italic' }}
              title="Italic"
            >
              I
            </Button>
            <Button
              onClick={toggleUnderline}
              className={`px-3 py-1 ${isUnderlined ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-500 hover:bg-gray-700'}`}
              sx={{ textTransform: 'none', textDecoration: 'underline' }}
              title="Underline"
            >
              U
            </Button>
          </ButtonGroup>

          {/* Text Color Picker */}
          <Stack direction="row" spacing={1} alignItems="center" className="text-white">
              <Typography component="span">Text:</Typography>
              {/* Basic styling for native color input */}
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setTextColor(newColor);
                  if (selection.start !== -1) {
                    applyTextColor(newColor);
                  }
                }}
                className="border-none bg-transparent h-[30px] w-[40px] p-0 cursor-pointer"
              />
          </Stack>

          {/* Background Color Picker */}
          <Stack direction="row" spacing={1} alignItems="center" className="text-white">
             <Typography component="span">BG:</Typography>
             {/* Basic styling for native color input */}
             <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="border-none bg-transparent h-[30px] w-[40px] p-0 cursor-pointer"
              />
          </Stack>

        </Stack>
      </Box>
    </Box>
  );
}

export default TeleprompterPage;