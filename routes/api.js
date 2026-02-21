const express = require('express');

const router = express.Router();
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/journey'; // Adjust to your backend port

export const startJourney = (destination, coords) => 
    axios.post(`${API_URL}/start`, { destination, ...coords });

export const updateJourneyLocation = (id, coords) => 
    axios.put(`${API_URL}/${id}/update`, coords);

export const endJourney = (id, coords) => 
    axios.post(`${API_URL}/${id}/end`, coords);