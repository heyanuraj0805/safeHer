// ============================================
// Safety Routes - Nearby places detection
// ============================================

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Overpass API for OpenStreetMap data
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// @route   GET /api/safety/nearby
// @desc    Get nearby safety resources (police, hospitals, etc.)
// @access  Public
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, type, radius = 5000 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Map type to OSM tags
        const typeMap = {
            police: {
                query: 'amenity=police',
                name: 'Police Station'
            },
            hospital: {
                query: 'amenity=hospital|amenity=clinic',
                name: 'Hospital'
            },
            pharmacy: {
                query: amenity=pharmacy,
                name: 'Pharmacy'
            },
            'women-help': {
                query: 'amenity=police',
                name: 'Women Help Desk'
            }
        };

        const config = typeMap[type] || typeMap.police;

        // Overpass QL query
        const overpassQuery = `
            [out:json][timeout:25];
            (
              ${config.query};
            );
            out body;
        `;

        const response = await fetch(`${OVERPASS_API}?data=${encodeURIComponent(overpassQuery)}`);
        const data = await response.json();

        // Process results
        const places = data.elements
            .filter(place => place.lat && place.lon)
            .map(place => {
                const distance = calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    place.lat,
                    place.lon
                );

                return {
                    id: place.id,
                    name: place.tags.name || config.name,
                    lat: place.lat,
                    lng: place.lon,
                    address: place.tags['addr:street'] || place.tags.address || '',
                    distance: Math.round(distance * 10) / 10, // km
                    phone: place.tags.phone || '',
                    openingHours: place.tags.opening_hours || ''
                };
            })
            .filter(place => place.distance <= (radius / 1000)) // Filter by radius
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10); // Limit to 10 results

        res.json({
            success: true,
            data: places,
            count: places.length
        });
    } catch (error) {
        console.error('Nearby search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find nearby places',
            error: error.message
        });
    }
});

// @route   GET /api/safety/score
// @desc    Calculate safety score for a location
// @access  Public
router.get('/score', async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Calculate time-based factors
        const hour = new Date().getHours();
        let score = 100;
        let factors = [];

        // Time factor
        if (hour >= 22 || hour < 5) {
            score -= 30;
            factors.push({ factor: 'Late Night', impact: -30, severity: 'high' });
        } else if (hour >= 5 && hour < 8) {
            score -= 15;
            factors.push({ factor: 'Early Morning', impact: -15, severity: 'medium' });
        }

        // In a real app, you would:
        // 1. Check crime statistics for the area
        // 2. Check street lighting data
        // 3. Check population density
        // 4. Check proximity to safety resources

        // Simulated factors for demo
        const nearbyResources = await checkNearbyResources(lat, lng);
        
        if (nearbyResources.policeCount === 0) {
            score -= 20;
            factors.push({ factor: 'No Police Nearby', impact: -20, severity: 'high' });
        } else if (nearbyResources.policeCount < 2) {
            score -= 10;
            factors.push({ factor: 'Limited Police Coverage', impact: -10, severity: 'medium' });
        }

        if (nearbyResources.hospitalCount === 0) {
            score -= 15;
            factors.push({ factor: 'No Hospital Nearby', impact: -15, severity: 'medium' });
        }

        // Ensure score is between 0 and 100
        score = Math.max(0, Math.min(100, score));

        // Determine status
        let status = 'Safe';
        if (score < 40) status = 'High Risk';
        else if (score < 60) status = 'Moderate Risk';
        else if (score < 80) status = 'Caution';

        res.json({
            success: true,
            data: {
                score,
                status,
                factors,
                recommendations: generateRecommendations(score, factors),
                nearbyResources
            }
        });
    } catch (error) {
        console.error('Safety score calculation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate safety score',
            error: error.message
        });
    }
});

// @route   GET /api/safety/safe-zones
// @desc    Get verified safe zones in an area
// @access  Public
router.get('/safe-zones', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;

        // In a real app, this would query a database of verified safe zones
        // For demo, return sample data
        const safeZones = [
            {
                id: 1,
                name: 'Central Police Station',
                type: 'police',
                lat: parseFloat(lat) + 0.01,
                lng: parseFloat(lng) + 0.01,
                distance: 1.2,
                verified: true,
                amenities: ['24/7 Security', 'Waiting Area', 'Water']
            },
            {
                id: 2,
                name: 'City Mall Safe Room',
                type: 'commercial',
                lat: parseFloat(lat) - 0.005,
                lng: parseFloat(lng) + 0.008,
                distance: 0.8,
                verified: true,
                amenities: ['Security Guard', 'CCTV', 'First Aid']
            },
            {
                id: 3,
                name: '24/7 Convenience Store',
                type: 'retail',
                lat: parseFloat(lat) + 0.003,
                lng: parseFloat(lng) - 0.002,
                distance: 0.5,
                verified: false,
                amenities: ['Extended Hours', 'Phone Charging']
            }
        ];

        res.json({
            success: true,
            data: safeZones
        });
    } catch (error) {
        console.error('Safe zones fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch safe zones',
            error: error.message
        });
    }
});

// Helper function to calculate distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Helper function to check nearby resources
async function checkNearbyResources(lat, lng) {
    // In a real app, this would query the database or external APIs
    return {
        policeCount: Math.floor(Math.random() * 3) + 1,
        hospitalCount: Math.floor(Math.random() * 2),
        pharmacyCount: Math.floor(Math.random() * 4)
    };
}

// Helper function to generate recommendations
function generateRecommendations(score, factors) {
    const recommendations = [];

    if (score < 60) {
        recommendations.push('Consider using SafeHer Journey Tracker');
        recommendations.push('Share your live location with trusted contacts');
    }

    if (factors.some(f => f.factor.includes('Police'))) {
        recommendations.push('Keep emergency numbers handy');
    }

    if (factors.some(f => f.factor.includes('Late Night'))) {
        recommendations.push('Avoid isolated areas');
        recommendations.push('Use well-lit, busy routes');
        recommendations.push('Consider using taxi/rideshare instead of walking');
    }

    recommendations.push('Trust your instincts - if something feels wrong, leave');

    return recommendations;
}

module.exports = router;