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

### local MySQL setup (NOTE: using spotify_charts for DB name here)

for user creation and granting privileges, use
```sql
CREATE USER 'spotify_admin'@'localhost' IDENTIFIED BY 'yourpass';
USE spotify_charts;
GRANT ALL PRIVILEGES ON * TO 'spotify_admin'@'localhost';
```

add in `.env`:
```
postgresql://spotify_admin:yourpass@localhost/spotify_charts
```

Side-note: to connect via `mysql` directly, use:
```
mysql -u spotify_admin spotify_charts --password=yourpass
```

### Create local dump of PlanetScale DB

Install planetscale CLI tool 

Then, run

```
pscale database dump spotify-charts main
```

to create a dump of the `main` branch of the database called `spotify-charts`


For this command to work, you will need to login (required command for this will be shown command to do this upon first execution of any command requiring auth)

See also [this](https://github.com/planetscale/discussion/discussions/168) GitHub issue

### Recreate DB from PlanetScale dump locally

Make sure a local (empty) database (`spotify_charts`) and user (`spotify_admin`) have been created (as explained above)

For some reason, no proper `.dump` file is created (which `mysqldump` would create), but rather a collection of `.sql` scripts including table schema creation commands (files ending with `schema.sql`) and commands for inserting the data (apparently those files ending with `00001.sql`).

So, to recreate the database we need to first run all table creation scripts and then those for inserting actual values, like so:

```
cat *-schema.sql | mysql -u spotify_admin spotify_charts --password=yourpass
cat *00001.sql | mysql -u spotify_admin spotify_charts --password=yourpass
```

### Connect to PlanetScale database directly via command line

To obtain required credentials, run

```
pscale connect spotify-charts main
```

you will be shown a local address and port that you can use for connection, e.g.

```
Tried address 127.0.0.1:3306, but it's already in use. Picking up a random port ...
Secure connection to database spotify-charts and branch main is established!.

Local address to connect your application: 127.0.0.1:38225 (press ctrl-c to quit)
```

Then you could in theory also run `mysql` and `mysqldump`, but `mysqldump` fails for this database as more than 100k rows are fetched during the dump and for some reason the connection crashes.