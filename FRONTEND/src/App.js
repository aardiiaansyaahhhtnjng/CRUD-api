import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const formatDate = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const App = () => {
  const [user, setUser] = useState([]);

  const getAllUsers = () => {
    fetch('/api/user')
        .then((res) => res.json())
        .then((json) => setUser(json.data ?? []));
    };

  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <div className="app-container">
      <h1 className="title">Data User</h1>
      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Email</th>
            <th>No. HP</th>
            <th>Tempat Lahir</th>
            <th>Tanggal Lahir</th>
            <th>Usia</th>
          </tr>
        </thead>
        <tbody>
          {user.length > 0 ? (
            user.map((data) => (
              // <tr key={data.id}>
              <tr key={data.id}>
                <td>{data.id}</td>
                <td>{data.name}</td>
                <td>{data.email}</td>
                <td>{data.phone_no}</td>
                <td>{data.place_of_birth}</td>
                <td>{formatDate(data.date_of_birth)}</td>
                <td>{data.age}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="empty-state">
                Belum ada data user.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <nav className="page-navigation">
        <Link className="testing-link" to="/testing">
          <h1 className="title">Buka halaman testing</h1>
        </Link>
      </nav>
    </div>
  );
};

export default App;