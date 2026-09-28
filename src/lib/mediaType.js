// Shared media-type helpers for gallery items stored as plain URLs
export const isVideoUrl = (url = '') => /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(url);
export const isAudioUrl = (url = '') => /\.(mp3|wav|m4a|aac|ogg|flac)(\?.*)?$/i.test(url);