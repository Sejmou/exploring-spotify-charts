# Spotify Charts Visualization Website

This is a web Next.js web app featuring an interactive visualization of Spotify chart tracks (2017 - 2021) using data collected both from Spotify's daily charts and the Spotify API.

The deployed website is available under (https://spotify-charts-viz.vercel.app/)[https://spotify-charts-viz.vercel.app/].

## Tech Stack

The project makes use of the [T3 Stack](https://create.t3.gg/) and was bootstrapped with `create-t3-app`. Technologies used include:

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

The app fetches data from a MySQL cloud database hosted on [PlanetScale](https://planetscale.com/).

## Local Development, Deployment etc.
Most information can probably be found on the [T3 Stack](https://create.t3.gg/) website. I only added some additional stuff that might potentially be relevant for me for future reference 

### local Postgres setup
```sql
CREATE DATABASE spotify_db;
CREATE USER spotify_admin WITH PASSWORD 'yourpass';
GRANT ALL PRIVILEGES ON DATABASE spotify_db TO spotify_admin;
```

add in `.env`:
```
postgresql://spotify_admin:yourpass@localhost/spotify_db
```

Of course, you will also need to update `prisma.schema` accordingly. Check their docs for details. 

### differences with MySQL
use `mysql` in connection string instead of `postgresql`

for user creation and granting privileges, use
```sql
CREATE USER 'spotify_admin'@'localhost' IDENTIFIED BY 'yourpass';
USE spotify_db;
GRANT ALL PRIVILEGES ON * TO 'spotify_admin'@'localhost';
```