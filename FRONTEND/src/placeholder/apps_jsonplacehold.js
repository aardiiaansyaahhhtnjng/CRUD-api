import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './json_image.css';

const PAGE_SIZE = 5;
const DEFAULT_FORM = {
  title: '',
  url: '',
  thumbnailUrl: '',
};

const AppJSONplacehold = () => {
  // 1. State utama untuk menyimpan data item yang ditampilkan.
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 2. Ambil data awal dari API JSONPlaceholder saat komponen pertama kali dibuka.
  useEffect(() => {
    const getAllusersPlaceHolder = async () => {
      try {
        const ITEMS_LIMIT = 20;
        const response = await fetch(`https://jsonplaceholder.typicode.com/photos?_limit=${ITEMS_LIMIT}`);
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Gagal mengambil data photos:', error);
      }
    };

    getAllusersPlaceHolder();
  }, []);

  // 3. Reset halaman ke 1 setiap kali pencarian berubah agar hasil tetap rapi.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 4. Jika user sedang mengedit item dan tombol clear all diklik, form juga dibersihkan.
  const handleClearAll = () => {
    setPosts([]);
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setCurrentPage(1);
  };

  // 5. Fungsi reload data dari API agar user dapat refresh daftar ke kondisi awal.
  const reloadPosts = async () => {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/photos?_limit=30');
      const data = await response.json();
      setPosts(data);
      setCurrentPage(1);
      setForm(DEFAULT_FORM);
      setEditingId(null);
    } catch (error) {
      console.error('Gagal me-refresh data photos:', error);
    }
  };

  // 6. Fungsi pencarian: cari berdasarkan judul, ID, atau URL untuk memfilter daftar.
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPosts = posts.filter((post) => {
    const searchableText = [post.id, post.title, post.url, post.thumbnailUrl]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedSearchTerm);
  });

  // 6. Logika pagination: ambil item sesuai halaman saat ini.
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + PAGE_SIZE);

  // 7. Fungsi untuk membaca input form ketika user mengisi title, url, atau thumbnailUrl.
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // 8. Fungsi add/update item: jika editingId ada, maka lakukan update; jika tidak, buat item baru.
  const handleSubmit = (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const url = form.url.trim();
    const thumbnailUrl = form.thumbnailUrl.trim() || url;

    if (!title || !url) {
      return;
    }

    if (editingId !== null) {
      // Mode edit: ubah item lama berdasarkan ID yang sedang diedit.
      setPosts((previousPosts) =>
        previousPosts.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title,
                url,
                thumbnailUrl,
              }
            : item
        )
      );
      setEditingId(null);
    } else {
      // Mode add: buat item baru dengan ID unik menggunakan timestamp.
      const newItem = {
        id: Date.now(),
        title,
        url,
        thumbnailUrl,
      };

      setPosts((previousPosts) => [newItem, ...previousPosts]);
    }

    setForm(DEFAULT_FORM);
  };

  // 9. Tombol edit: isi form dengan data item yang dipilih agar user bisa memperbarui nilainya.
  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl || item.url,
    });
  };

  // 10. Tombol hapus: remove item dari state berdasarkan ID.
  const handleDelete = (id) => {
    setPosts((previousPosts) => previousPosts.filter((item) => item.id !== id));

    if (editingId === id) {
      setEditingId(null);
      setForm(DEFAULT_FORM);
    }
  };

  return (
    <div className="app-container">
      <nav className="page-navigation">
        <Link className="testing-link" to="/">
          Kembali ke data user
        </Link>
      </nav>
      <h1 className="title">TESTING</h1>

      {/* Form add/edit item */}
      <form className="item-form" onSubmit={handleSubmit}>
        <h2 className="form-title">{editingId !== null ? 'Edit item' : 'Tambah item baru'}</h2>

        <div className="form-grid">
          <input
            type="text"
            name="title"
            className="form-input"
            value={form.title}
            onChange={handleInputChange}
            placeholder="Judul item"
          />
          <input
            type="url"
            name="url"
            className="form-input"
            value={form.url}
            onChange={handleInputChange}
            placeholder="URL gambar"
          />
          <input
            type="url"
            name="thumbnailUrl"
            className="form-input"
            value={form.thumbnailUrl}
            onChange={handleInputChange}
            placeholder="URL thumbnail (opsional)"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-btn">
            {editingId !== null ? 'Update item' : 'Add item'}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setEditingId(null);
                setForm(DEFAULT_FORM);
              }}
            >
              Cancel
            </button>
          )}

          <button type="button" className="danger-btn" onClick={handleClearAll}>
            Clear all
          </button>

          <button type="button" className="refresh-btn" onClick={reloadPosts}>
            Refresh
          </button>
        </div>
      </form>

      {/* Search field */}
      <div className="toolbar">
        <label className="search-label" htmlFor="post-search">
          Cari post
        </label>
        <input
          id="post-search"
          className="search-input"
          type="search"
          placeholder="Cari ID, judul, atau URL..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {/* Pagination controls */}
      <div className="pagination">
        <button
          type="button"
          className="page-btn"
          disabled={safeCurrentPage === 1}
          onClick={() => setCurrentPage((previous) => Math.max(previous - 1, 1))}
        >
          Previous
        </button>

        <span className="page-info">
          Page {safeCurrentPage} / {totalPages}
        </span>

        <button
          type="button"
          className="page-btn"
          disabled={safeCurrentPage === totalPages}
          onClick={() => setCurrentPage((previous) => Math.min(previous + 1, totalPages))}
        >
          Next
        </button>
      </div>

      <table className="user-table-place">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Image</th>
            <th>Thumbnail</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPosts.length > 0 ? (
            currentPosts.map((data) => (
              <tr key={data.id}>
                <td>{data.id}</td>
                <td className="title-cell">{data.title}</td>
                <td>
                  <img
                    src={data.url}
                    alt={data.title}
                    className="gallery-image"
                    onError={(event) => {
                      event.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                    }}
                  />
                </td>
                <td>
                  <img
                    src={data.thumbnailUrl || data.url}
                    alt={`${data.title} thumbnail`}
                    className="thumbnail-image"
                    onError={(event) => {
                      event.target.src = 'https://via.placeholder.com/80?text=Thumb';
                    }}
                  />
                </td>
                <td>
                  <div className="action-group">
                    <button type="button" className="edit-btn" onClick={() => handleEdit(data)}>
                      Edit
                    </button>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(data.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="empty-state">
                {posts.length === 0
                  ? 'Belum ada data post.'
                  : 'Tidak ada post yang cocok dengan pencarian.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AppJSONplacehold;