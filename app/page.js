'use client'
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { firestore } from "@/firebase";
import { Box, Modal, Typography, Stack, Button, TextField } from '@mui/material';
import { collection, getDocs, deleteDoc, query, setDoc, doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [openRecipe, setOpenRecipe] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item) => {
    if (!item) return;
    const docRef = doc(collection(firestore, 'inventory'), item.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };
  
  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;

      try {
        const response = await fetch('/api/identify-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64Image }),
        });

        const data = await response.json();

        if (response.ok) {
          const identifiedItem = data.item;
          addItem(identifiedItem);
          alert(`${identifiedItem.charAt(0).toUpperCase() + identifiedItem.slice(1)} added to inventory!`);
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Failed to identify the image. Please try again.");
      }
    };
  };

  const handleGetRecipes = async () => {
    const inventoryNames = inventory.map(item => item.name).join(', ');
    if (!inventoryNames) {
      alert("Your pantry is empty! Add some items to get recipes.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/get-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventory: inventoryNames }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecipes(data.recipes);
        setOpenRecipe(true);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to fetch from API route:", error);
      alert("Failed to get recipes. Check the console for more details.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        accept="image/*"
      />
      
      <Image 
        src="/pantry-image.jpeg"
        width={800}
        height={400}
        alt="Pantry"
        style={{ borderRadius: '8px' }}
      />

      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{ transform: 'translate(-50%, -50%)' }}
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openRecipe} onClose={() => setOpenRecipe(false)}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={2}
          sx={{ transform: 'translate(-50%, -50%)' }}
        >
          <Typography variant="h6">Suggested Recipes</Typography>
          <Stack>
            {recipes.map((recipe, index) => (
              <Typography key={index} variant="body1">{`• ${recipe}`}</Typography>
            ))}
          </Stack>
        </Box>
      </Modal>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={handleOpen}>
          Add New Item
        </Button>
        <Button variant="contained" color="secondary" onClick={() => fileInputRef.current.click()}>
          Add by Image
        </Button>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleGetRecipes}
          disabled={isLoading}
        >
          {isLoading ? 'Getting Recipes...' : 'Get Recipes'}
        </Button>
      </Stack>

      <TextField
        variant="outlined"
        placeholder="Search..."
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ width: '800px', mt: 2 }}
      />
      
      <Box sx={{ border: '1px solid #333', mt: 1 }}>
        <Box
          width="800px"
          height="100px"
          bgcolor="#ADD8E6"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant='h2' color="#333">
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow="auto">
          {filteredInventory.map(({ name, quantity }) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ bgcolor: '#f0f0f0', padding: 5 }}
            >
              <Typography variant="h3" color="#333" textAlign="center">
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h3" color="#333" textAlign="center">
                {quantity}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => addItem(name)}>
                  Add
                </Button>
                <Button variant="contained" onClick={() => removeItem(name)}>
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}