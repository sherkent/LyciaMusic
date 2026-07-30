import type { AlbumCatalogItem, ArtistCatalogItem, Song } from '../../types';

export type ArtistListItem = ArtistCatalogItem;
export type AlbumListItem = AlbumCatalogItem;

export const isDirectParent = (parentPath: string, childPath: string) => {
  if (!parentPath || !childPath) return false;

  const normalizedParent = parentPath.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedChild = childPath.replace(/\\/g, '/');
  const lastSlash = normalizedChild.lastIndexOf('/');

  return lastSlash !== -1 && normalizedChild.substring(0, lastSlash) === normalizedParent;
};

export const getSongArtistNames = (song: Song | undefined) => {
  if (!song) {
    return ['Unknown'];
  }

  if (Array.isArray(song.effective_artist_names) && song.effective_artist_names.length > 0) {
    return song.effective_artist_names;
  }

  if (Array.isArray(song.artist_names) && song.artist_names.length > 0) {
    return song.artist_names;
  }

  return [song.artist || 'Unknown'];
};

// 修复：允许传入 undefined，避免歌曲已被移除时调用方使用非空断言导致运行时异常
export const songHasArtist = (song: Song | undefined, artistName: string) =>
  !!song && getSongArtistNames(song).some(name => name === artistName);

export const getSongAlbumKey = (song: Song | undefined) =>
  song?.album_key || (song ? `${song.album || 'Unknown'}::${song.album_artist || song.artist || 'Unknown'}` : '');

// 修复：允许传入 undefined，避免歌曲已被移除时调用方使用非空断言导致运行时异常
export const matchesAlbumKey = (song: Song | undefined, albumKey: string) =>
  !!song && getSongAlbumKey(song) === albumKey;

export const getSongArtistSearchText = (song: Song | undefined) =>
  song ? [song.artist, song.album_artist, ...getSongArtistNames(song)].join(' ').toLowerCase() : '';

// 修复：允许传入 undefined，避免歌曲已被移除时调用方使用非空断言导致运行时异常
export const getSongTitleLabel = (song: Song | undefined) => song?.title || song?.name || '';

// 修复：允许传入 undefined，避免歌曲已被移除时调用方使用非空断言导致运行时异常
export const getSongFileNameLabel = (song: Song | undefined) => song?.name || '';

// 修复：允许传入 undefined，并对 song.name 做可选链处理，避免 undefined 时调用 replace 抛出 TypeError
export const getSongDisplayTitle = (song: Song | undefined) =>
  song?.title?.trim() || song?.name?.replace(/\.[^/.]+$/, '') || song?.name || '';

export const parseSortIndexValue = (value?: string) => {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/\d+/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const compareSongPathsByTrackNumber = (
  left: string,
  right: string,
  songLookup: Map<string, Song>,
): number => {
  const leftSong = songLookup.get(left);
  const rightSong = songLookup.get(right);

  const leftDisc = parseSortIndexValue(leftSong?.disc_number);
  const rightDisc = parseSortIndexValue(rightSong?.disc_number);
  let result = 0;

  if (leftDisc === null && rightDisc !== null) {
    result = 1;
  } else if (leftDisc !== null && rightDisc === null) {
    result = -1;
  } else if (leftDisc !== null && rightDisc !== null && leftDisc !== rightDisc) {
    result = leftDisc - rightDisc;
  }

  if (result === 0) {
    const leftTrack = parseSortIndexValue(leftSong?.track_number);
    const rightTrack = parseSortIndexValue(rightSong?.track_number);

    if (leftTrack === null && rightTrack !== null) {
      result = 1;
    } else if (leftTrack !== null && rightTrack === null) {
      result = -1;
    } else if (leftTrack !== null && rightTrack !== null && leftTrack !== rightTrack) {
      result = leftTrack - rightTrack;
    }
  }

  if (result === 0) {
    const leftTitle = leftSong ? (leftSong.title || leftSong.name) : '';
    const rightTitle = rightSong ? (rightSong.title || rightSong.name) : '';
    result = leftTitle.localeCompare(rightTitle, 'zh-CN') || left.localeCompare(right, 'zh-CN');
  }

  return result;
};

