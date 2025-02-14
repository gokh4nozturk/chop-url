# Chop URL One Link Analytics System

## Overview

Chop URL provides comprehensive analytics through a combination of real-time WebSocket updates and REST APIs. The system tracks various event types, collects detailed metrics, and offers both URL-specific and user-level analytics.

## System Architecture

### High-Level Overview
```mermaid
graph TD
    subgraph "Data Sources"
        RS[Redirect Service]
        Clients[Client SDKs]
        Browser[Browser Script]
    end

    subgraph "Frontend Layer"
        UI[Analytics Dashboard]
        Store[Zustand Store]
        WS[WebSocket Client]
        Cache[Browser Cache]
    end

    subgraph "API Layer (Cloudflare Workers)"
        Router[Hono Router]
        API[Analytics API]
        WSS[WebSocket Server]
        KVCache[KV Cache]
        subgraph "Services"
            AS[Analytics Service]
            WService[WebSocket Service]
            Validator[Zod Schema Validator]
        end
    end

    subgraph "Database Layer"
        D1[(Cloudflare D1)]
        subgraph "Tables"
            Events[Events]
            URLs[URLs]
            Users[Users]
        end
    end

    %% Data Collection
    RS -->|Track Events| API
    Clients -->|Track Events| API
    Browser -->|Track Events| API

    %% Frontend Relations
    UI <--> Store
    Store <--> Cache
    Store <--> WS
    Store <--> API

    %% API Layer Relations
    Router --> API
    Router --> WSS
    API --> AS
    WSS --> WService
    API <--> Validator
    AS <--> KVCache
    WService <--> KVCache
    WService <--> AS

    %% Database Relations
    AS --> D1
    D1 --- Events
    D1 --- URLs
    D1 --- Users

    %% Realtime Communication
    WS <-.-> WSS
    WSS <-.-> AS
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant Cache as Browser Cache
    participant API as Analytics API
    participant KV as KV Cache
    participant WS as WebSocket
    participant DB as Database

    U->>FE: View Analytics
    
    alt Cache Hit
        FE->>Cache: Check Cache
        Cache-->>FE: Return Cached Data
        FE->>U: Show Data
    else Cache Miss
        FE->>API: Request Data
        API->>KV: Check KV Cache
        
        alt KV Cache Hit
            KV-->>API: Return Data
        else KV Cache Miss
            API->>DB: Query Data
            DB-->>API: Return Data
            API->>KV: Cache Data
        end
        
        API-->>FE: Return Data
        FE->>Cache: Cache Data
        FE->>U: Show Data
    end

    par Real-time Updates
        WS->>FE: New Event
        FE->>Cache: Update Cache
        FE->>U: Update UI
    end
```

### Component Structure

```mermaid
graph TD
    subgraph "Analytics Dashboard"
        CD[Client Analytics]
        RTS[Real-time Stats]
        Charts[Chart Components]
        Stats[Stats Cards]
    end

    subgraph "State Management"
        AS[Analytics Store]
        WS[WebSocket Store]
        US[UI Store]
        CS[Cache Store]
    end

    subgraph "Services"
        HTTP[HTTP Client]
        WSC[WebSocket Client]
        Cache[Cache Service]
        ErrorBoundary[Error Boundary]
    end

    CD --> AS
    CD --> Charts
    CD --> Stats
    RTS --> WS
    RTS --> Stats

    AS <--> HTTP
    WS <--> WSC
    HTTP <--> Cache
    WSC <--> Cache
    ErrorBoundary --> WSC
    
    AS <--> CS
    WS <--> CS
    US <--> CS
```

## Core Features

### 1. Event Tracking
- Multiple event types:
  - `REDIRECT`: URL redirection events
  - `PAGE_VIEW`: Page view tracking
  - `CLICK`: Click events
  - `CONVERSION`: Conversion tracking
  - `CUSTOM`: User-defined custom events

### 2. Data Collection

#### Device Information
```typescript
interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}
```

#### Geographic Data
```typescript
interface GeoInfo {
  country: string;
  city: string;
  region: string;
  regionCode: string;
  timezone: string;
  longitude: string;
  latitude: string;
  postalCode: string;
}
```

#### UTM Parameters
```typescript
interface EventProperties {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  shortId: string;
  originalUrl: string;
}
```

### 3. Real-time Updates

#### WebSocket Architecture
```mermaid
graph TD
    subgraph "Client Side"
        C[Client] -->|Connect| WS[WebSocket Client]
        EB[Error Boundary] -->|Auto Reconnect| WS
    end

    subgraph "Server Side"
        WSS[WebSocket Server]
        WService[WebSocket Service]
        AS[Analytics Service]
        KV[(KV Cache)]
    end

    WS -->|Subscribe to Room| WSS
    WSS <--> WService
    WService <--> AS
    WService <--> KV
    AS -->|Track Event| WService
```

#### Connection Management
- Room-based subscriptions (`url:{shortId}`)
- Automatic reconnection
- Connection state tracking
- Error recovery

### 4. Data Storage

#### Database Schema
- Events table
  - Core event data
  - JSON-serialized properties (UTM, custom data)
  - Device and geo info
  - Timestamps
  - User and URL references
- URLs table
  - Short URL data
  - Creation info
  - User reference
- Users table
  - User information
  - Authentication data
  - Preferences

### 5. Analytics Features

#### URL Analytics
- Total clicks and unique visitors
- Click history with time ranges
- Geographic distribution
- Device and browser stats
- UTM parameter tracking
- Real-time updates

#### User Analytics
- Aggregated stats across all URLs
- Custom event tracking
- Time-based filtering
- Detailed breakdowns

### 6. Frontend Implementation

#### State Management
- Zustand stores:
  - Analytics state
  - WebSocket state
  - UI state
- Real-time sync
- Optimistic updates

#### UI Components
- Real-time counters
- Time series charts
- Distribution visualizations
- Loading states
- Error boundaries

### 7. API Endpoints

#### Analytics Routes
- `POST /events`: Track new events
- `POST /custom-events`: Create custom events
- `GET /events/:urlId`: Get URL events
- `GET /custom-events/:userId`: Get user's custom events
- `GET /urls/:shortId/stats`: Get URL statistics
- `GET /urls/:shortId/events`: Get filtered events
- `GET /urls/:shortId/geo`: Get geographic stats
- `GET /urls/:shortId/devices`: Get device stats
- `GET /user/analytics`: Get user dashboard stats

### 8. Error Handling

#### Backend
- Custom error classes
- Input validation with Zod
- Database error handling
- Graceful degradation

#### Frontend
- Error boundaries
- Loading states
- Retry mechanisms
- User feedback

## Future Improvements

### Planned Features
- Advanced filtering and search
- Custom dashboards
- Export functionality
- Enhanced visualizations
- Real-time alerts