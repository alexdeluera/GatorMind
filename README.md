# GatorMind

## Backend database

The FastAPI backend now uses **MongoDB** (via the
`motor` async driver) as its primary database. Configure
the connection with environment variables:

- `MONGODB_URI` (default: `mongodb://localhost:27017`)
- `MONGODB_DB` (default: `gator_db`)

To install backend dependencies and run the API:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
