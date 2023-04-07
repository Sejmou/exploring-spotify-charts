// schema created by running
// npx drizzle-kit introspect:mysql --out=migrations/ --connectionString=mysql://spotify_admin:yourpass@localhost/spotify_db
import {
  mysqlTable,
  varchar,
  datetime,
  index,
  primaryKey,
  int,
  uniqueIndex,
  double,
} from "drizzle-orm/mysql-core";

export const album = mysqlTable("Album", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  name: varchar("name", { length: 191 }).notNull(),
  type: varchar("type", { length: 191 }).notNull(),
  releaseDate: datetime("releaseDate", { mode: "string", fsp: 3 }).notNull(),
  releaseDatePrecision: varchar("releaseDatePrecision", {
    length: 191,
  }).notNull(),
  imgUrl: varchar("imgUrl", { length: 191 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 191 }),
  label: varchar("label", { length: 191 }).notNull(),
});

export const albumArtistEntry = mysqlTable(
  "AlbumArtistEntry",
  {
    artistId: varchar("artistId", { length: 191 }).notNull(),
    rank: int("rank").notNull(),
    albumId: varchar("albumId", { length: 191 }).notNull(),
  },
  (table) => {
    return {
      albumIdIdx: index("AlbumArtistEntry_albumId_idx").on(table.albumId),
      artistIdIdx: index("AlbumArtistEntry_artistId_idx").on(table.artistId),
      albumArtistEntryArtistIdAlbumId: primaryKey(
        table.artistId,
        table.albumId
      ),
    };
  }
);

export const artist = mysqlTable("Artist", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  name: varchar("name", { length: 191 }).notNull(),
  imgUrl: varchar("imgUrl", { length: 191 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 191 }),
});

export const country = mysqlTable("Country", {
  name: varchar("name", { length: 191 }).primaryKey().notNull(),
  isoAlpha3: varchar("isoAlpha3", { length: 191 }).notNull(),
  isoAlpha2: varchar("isoAlpha2", { length: 191 }).notNull(),
  geoRegion: varchar("geoRegion", { length: 191 }).notNull(),
  geoSubregion: varchar("geoSubregion", { length: 191 }).notNull(),
});

export const countryChartEntry = mysqlTable(
  "CountryChartEntry",
  {
    id: varchar("id", { length: 191 }).primaryKey().notNull(),
    countryName: varchar("countryName", { length: 191 }).notNull(),
    trackId: varchar("trackId", { length: 191 }).notNull(),
    date: datetime("date", { mode: "string", fsp: 3 }).notNull(),
    rank: int("rank").notNull(),
    streams: double("streams").notNull(),
  },
  (table) => {
    return {
      countryNameTrackIdDateKey: uniqueIndex(
        "CountryChartEntry_countryName_trackId_date_key"
      ).on(table.countryName, table.trackId, table.date),
      countryNameIdx: index("CountryChartEntry_countryName_idx").on(
        table.countryName
      ),
      trackIdIdx: index("CountryChartEntry_trackId_idx").on(table.trackId),
      dateIdx: index("CountryChartEntry_date_idx").on(table.date),
      trackIdDateIdx: index("CountryChartEntry_trackId_date_idx").on(
        table.trackId,
        table.date
      ),
    };
  }
);

export const genre = mysqlTable("Genre", {
  label: varchar("label", { length: 191 }).primaryKey().notNull(),
});

export const globalChartEntry = mysqlTable(
  "GlobalChartEntry",
  {
    id: varchar("id", { length: 191 }).primaryKey().notNull(),
    trackId: varchar("trackId", { length: 191 }).notNull(),
    date: datetime("date", { mode: "string", fsp: 3 }).notNull(),
    rank: int("rank").notNull(),
    streams: double("streams").notNull(),
  },
  (table) => {
    return {
      trackIdDateKey: uniqueIndex("GlobalChartEntry_trackId_date_key").on(
        table.trackId,
        table.date
      ),
      trackIdIdx: index("GlobalChartEntry_trackId_idx").on(table.trackId),
      dateIdx: index("GlobalChartEntry_date_idx").on(table.date),
      trackIdDateIdx: index("GlobalChartEntry_trackId_date_idx").on(
        table.trackId,
        table.date
      ),
    };
  }
);

export const isrcAgency = mysqlTable(
  "ISRCAgency",
  {
    id: varchar("id", { length: 191 }).primaryKey().notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    territory: varchar("territory", { length: 191 }),
  },
  (table) => {
    return {
      nameTerritoryKey: uniqueIndex("ISRCAgency_name_territory_key").on(
        table.name,
        table.territory
      ),
      territoryIdx: index("ISRCAgency_territory_idx").on(table.territory),
    };
  }
);

export const track = mysqlTable(
  "Track",
  {
    id: varchar("id", { length: 191 }).primaryKey().notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    previewUrl: varchar("previewUrl", { length: 191 }),
    albumId: varchar("albumId", { length: 191 }).notNull(),
    isrc: varchar("isrc", { length: 191 }).notNull(),
    isrcYear: int("isrcYear").notNull(),
    isrcAgencyId: varchar("isrcAgencyId", { length: 191 }).notNull(),
    danceability: double("danceability").notNull(),
    energy: double("energy").notNull(),
    loudness: double("loudness").notNull(),
    speechiness: double("speechiness").notNull(),
    acousticness: double("acousticness").notNull(),
    instrumentalness: double("instrumentalness").notNull(),
    liveness: double("liveness").notNull(),
    valence: double("valence").notNull(),
    tempo: double("tempo").notNull(),
    durationMs: double("durationMs").notNull(),
    mode: varchar("mode", { length: 191 }).notNull(),
    key: varchar("key", { length: 191 }).notNull(),
    explicit: varchar("explicit", { length: 191 }).notNull(),
    timeSignature: varchar("timeSignature", { length: 191 }).notNull(),
  },
  (table) => {
    return {
      albumIdIdx: index("Track_albumId_idx").on(table.albumId),
      isrcAgencyIdIdx: index("Track_isrcAgencyId_idx").on(table.isrcAgencyId),
    };
  }
);

export const trackArtistEntry = mysqlTable(
  "TrackArtistEntry",
  {
    artistId: varchar("artistId", { length: 191 }).notNull(),
    rank: int("rank").notNull(),
    trackId: varchar("trackId", { length: 191 }).notNull(),
  },
  (table) => {
    return {
      trackIdIdx: index("TrackArtistEntry_trackId_idx").on(table.trackId),
      artistIdIdx: index("TrackArtistEntry_artistId_idx").on(table.artistId),
      trackArtistEntryArtistIdTrackId: primaryKey(
        table.artistId,
        table.trackId
      ),
    };
  }
);

export const artistToGenre = mysqlTable(
  "_ArtistToGenre",
  {
    a: varchar("A", { length: 191 }).notNull(),
    b: varchar("B", { length: 191 }).notNull(),
  },
  (table) => {
    return {
      abUnique: uniqueIndex("_ArtistToGenre_AB_unique").on(table.a, table.b),
      bIdx: index("ArtistToGenre_B").on(table.b),
      artistToGenreAB: primaryKey(table.a, table.b),
    };
  }
);
