# Cognilytics MIS

Cognilytics Management Information System - A platform for tracking and analyzing cognitive load in educational settings.

## Project Structure

```
cognilytics-mis/
├── backend/          # Node.js/Express backend
├── frontend/         # React frontend
├── analytics/        # Python analytics scripts and notebooks
├── database/         # Database schemas and migrations
├── docs/             # Documentation
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Docker & Docker Compose

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cognilytics-mis
```

2. Start services with Docker Compose
```bash
docker-compose up -d
```

3. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database: localhost:5432

## Development

See individual README files in each directory for specific development instructions:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Analytics README](./analytics/README.md)

## Documentation

- [Architecture](./docs/architecture.md)
- [Cognitive Load Algorithm](./docs/cl_algorithm.md)
- [API Reference](./docs/api_reference.md)
- [Data Privacy](./docs/data_privacy.md)
- [User Roles](./docs/user_roles.md)

## License

TBD
