import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const port = 5003;
const baseURL = `http://localhost:${port}`; 

const Profile = () => {
  const [username] = useState(localStorage.getItem('username'));
  const [bio, setBio] = useState('Loading...');
  const [nickname, setNickname] = useState('Loading...');
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [error, setError] = useState(null);

  const fetchBio = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/user/${username}/bio`);
      console.log('Fetch Bio Response:', response.data);
      setBio(response.data.bio || '');
      setError(null);
    } catch (error) {
      console.error("Failed to load user bio", error);
      setError('Failed to load bio. Please try again.');
      setBio('');
    }
  }, [username]);

  const fetchNickname = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/user/${username}/nickname`);
      console.log('Fetch Nickname Response:', response.data);
      setNickname(response.data.nickname || '');
      setError(null);
    } catch (error) {
      console.error("Failed to load user nickname", error);
      setError('Failed to load nickname. Please try again.');
      setNickname('');
    }
  }, [username]);

  useEffect(() => {
    fetchBio();
    fetchNickname();
  }, [fetchBio, fetchNickname]);

  const handleEditBio = () => {
    setIsEditingBio(true);
    setNewBio(bio);
  };

  const handleSaveBio = async () => {
    try {
      console.log('Saving Bio:', { 
        url: `${baseURL}/user/${username}/bio`, 
        bio: newBio 
      });

      const response = await axios.put(`${baseURL}/user/${username}/bio`, { 
        bio: newBio 
      });
      
      console.log('Bio Update Response:', response.data);
      
      if (response.data.success) {
        setBio(newBio);
        setIsEditingBio(false);
        setError(null);
      } else {
        setError(response.data.message || 'Update failed. Please try again.');
      }
    } catch (error) {
      console.error("Failed to update bio", error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to update bio'
      );
    }
  };

  const handleEditNickname = () => {
    setIsEditingNickname(true);
    setNewNickname(nickname);
  };

  const handleSaveNickname = async () => {
    try {
      console.log('Saving Nickname:', { 
        url: `${baseURL}/user/${username}/nickname`, 
        nickname: newNickname 
      });

      const response = await axios.put(`${baseURL}/user/${username}/nickname`, { 
        nickname: newNickname 
      });
      
      console.log('Nickname Update Response:', response.data);
      
      if (response.data.success) {
        setNickname(newNickname);
        setIsEditingNickname(false);
        setError(null);
      } else {
        setError(response.data.message || 'Update failed. Please try again.');
      }
    } catch (error) {
      console.error("Failed to update nickname", error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to update nickname'
      );
    }
  };

  return (
    <div style={styles.container}>
      <h1>{username}'s Profile</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <div style={styles.section}>
        <strong>Bio:</strong>
        {isEditingBio ? (
          <div>
            <textarea 
              style={styles.textarea}
              value={newBio} 
              onChange={(e) => setNewBio(e.target.value)} 
            />
            <button style={styles.button} onClick={handleSaveBio}>Save</button>
            <button style={styles.button} onClick={() => setIsEditingBio(false)}>Cancel</button>
          </div>
        ) : (
          <p>{bio || 'No bio yet'}</p>
        )}
        {!isEditingBio && <button style={styles.button} onClick={handleEditBio}>Edit Bio</button>}
      </div>
      
      <div style={styles.section}>
        <strong>Nickname:</strong>
        {isEditingNickname ? (
          <div>
            <input 
              style={styles.input}
              type="text" 
              value={newNickname} 
              onChange={(e) => setNewNickname(e.target.value)} 
            />
            <button style={styles.button} onClick={handleSaveNickname}>Save</button>
            <button style={styles.button} onClick={() => setIsEditingNickname(false)}>Cancel</button>
          </div>
        ) : (
          <p>{nickname || 'No nickname yet'}</p>
        )}
        {!isEditingNickname && <button style={styles.button} onClick={handleEditNickname}>Edit Nickname</button>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  button: {
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    marginRight: '10px',
  },
  section: {
    margin: '20px 0',
    textAlign: 'left',
  },
  input: {
    padding: '8px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    marginBottom: '10px',
  },
  textarea: {
    padding: '8px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    marginBottom: '10px',
    minHeight: '100px',
  },
};

export default Profile;