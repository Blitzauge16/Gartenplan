const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const fetchGardens = async () => {
  const response = await fetch(`${API_URL}/gardens`);
  return response.json();
};

export const saveGarden = async (gardenData) => {
  const response = await fetch(`${API_URL}/gardens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gardenData)
  });
  return response.json();
};