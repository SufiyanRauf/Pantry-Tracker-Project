'use client'
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { firestore } from "@/firebase";
import { Box, Modal, Typography, Stack, Button, TextField, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { collection, getDocs, deleteDoc, query, setDoc, doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [recipes, setRecipes] = useState([]);
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const closeSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

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

  const clearInventory = async () => {
    for (const item of inventory) {
      await deleteDoc(doc(collection(firestore, 'inventory'), item.name));
    }
    await updateInventory();
    setConfirmOpen(false);
    showSnackbar('Pantry cleared.', 'success');
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
          showSnackbar(`${identifiedItem.charAt(0).toUpperCase() + identifiedItem.slice(1)} added to inventory!`, 'success');
        } else {
          showSnackbar(`Error: ${data.error}`, 'error');
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
        showSnackbar('Failed to identify the image. Please try again.', 'error');
      }
    };
  };

  const handleGetRecipes = async () => {
    const inventoryNames = inventory.map(item => item.name).join(', ');
    if (!inventoryNames) {
      showSnackbar('Your pantry is empty! Add some items to get recipes.', 'warning');
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
      } else {
        showSnackbar(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error("Failed to fetch from API route:", error);
      showSnackbar('Failed to get recipes. Check the console for more details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box
      width="100%"
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      gap={2}
      sx={{ bgcolor: '#fff5e9', py: 5, px: { xs: 2, sm: 3 }, boxSizing: 'border-box' }}
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
        style={{ borderRadius: '8px', objectFit: 'cover', width: '100%', maxWidth: '800px', height: 'auto' }}
      />

      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={{ xs: '90%', sm: 400 }}
          bgcolor="white"
          border="1px solid #eaddc7"
          borderRadius={2}
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

      <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center" useFlexGap>
        <Button variant="contained" onClick={handleOpen} sx={{ bgcolor: '#2e7d32', textTransform: 'none', px: 3, py: 1, fontSize: '1rem', '&:hover': { bgcolor: '#1b5e20' } }}>
          Add New Item
        </Button>
        <Button variant="contained" onClick={() => fileInputRef.current.click()} sx={{ bgcolor: '#2e7d32', textTransform: 'none', px: 3, py: 1, fontSize: '1rem', '&:hover': { bgcolor: '#1b5e20' } }}>
          Add by Image
        </Button>
        <Button
          variant="contained"
          onClick={handleGetRecipes}
          disabled={isLoading}
          sx={{ bgcolor: '#2e7d32', textTransform: 'none', px: 3, py: 1, fontSize: '1rem', '&:hover': { bgcolor: '#1b5e20' } }}
        >
          {isLoading ? 'Getting Recipes...' : 'Get Recipes'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => setConfirmOpen(true)}
          disabled={inventory.length === 0}
          sx={{ color: '#2e7d32', borderColor: '#a5cfa8', textTransform: 'none', px: 3, py: 1, fontSize: '1rem', '&:hover': { borderColor: '#2e7d32', bgcolor: '#edf7ee' } }}
        >
          Clear Inventory
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="flex-start" flexWrap="wrap" justifyContent="center" sx={{ mt: 2 }}>
      <Box sx={{ width: { xs: '100%', md: '800px' }, border: '1px solid #c2a47e', borderRadius: 2, overflow: 'hidden' }}>
        <Box
          width="100%"
          height="64px"
          bgcolor="#fdba74"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant='h4' color="#7c2d12">
            Inventory Items
          </Typography>
        </Box>
        <Box width="100%" sx={{ p: 2, bgcolor: '#fffaf3', borderBottom: '1px solid #f1e4d2' }}>
          <TextField
            variant="outlined"
            placeholder="Search items..."
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              bgcolor: '#fff',
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#c2a47e' },
                '&:hover fieldset': { borderColor: '#9a7b54' },
                '&.Mui-focused fieldset': { borderColor: '#c2410c' },
              },
              '& .MuiOutlinedInput-input::placeholder': { color: '#7c6a55', opacity: 1 },
            }}
          />
        </Box>
        <Stack width="100%" height="300px" spacing={0} overflow="auto" sx={{ bgcolor: '#fffaf3' }}>
          {filteredInventory.map(({ name, quantity }) => (
            <Box
              key={name}
              width="100%"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 3, py: 1.5, borderBottom: '1px solid #f1e4d2' }}
            >
              <Typography variant="h6" color="#3f2d1c" sx={{ flex: 1 }}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h6" color="#3f2d1c" sx={{ width: 48, textAlign: 'center' }}>
                {quantity}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={() => addItem(name)} sx={{ bgcolor: '#2e7d32', textTransform: 'none', minWidth: 64, '&:hover': { bgcolor: '#1b5e20' } }}>
                  Add
                </Button>
                <Button variant="outlined" size="small" onClick={() => removeItem(name)} sx={{ color: '#6b5d4f', borderColor: '#d8c8b4', textTransform: 'none', minWidth: 64, '&:hover': { borderColor: '#6b5d4f', bgcolor: '#f5efe6' } }}>
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ width: { xs: '100%', md: '340px' }, height: '435px', border: '1px solid #c2a47e', borderRadius: 2, bgcolor: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #c2a47e' }}>
          <Typography variant="h5" sx={{ color: '#7c2d12', fontWeight: 700 }}>
            Suggested Recipes
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#6b5d4f' }}>
            Click the Get Recipes button to see ideas based on what is in your pantry.
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {recipes.length > 0 && (
            <Stack spacing={1}>
              {recipes.map((recipe, index) => (
                <Typography key={index} variant="body1">{`• ${recipe}`}</Typography>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
      </Stack>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ color: '#7c2d12' }}>Clear pantry?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes all {inventory.length} item{inventory.length === 1 ? '' : 's'} from your pantry. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#6b5d4f', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={clearInventory} variant="contained" sx={{ bgcolor: '#2e7d32', textTransform: 'none', '&:hover': { bgcolor: '#1b5e20' } }}>
            Clear all
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}