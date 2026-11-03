import React from 'react';
export default function CoverImage({src,seriesKey,alt='',...props}) {
  const fallback=seriesKey?`/assets/series/${encodeURIComponent(seriesKey)}-poster.jpg`:'/assets/cover-placeholder.svg';
  return <img {...props} src={src||fallback} alt={alt} onError={e=>{const img=e.currentTarget;if(!img.dataset.fallback){img.dataset.fallback='series';img.src=fallback;}else if(img.dataset.fallback==='series'){img.dataset.fallback='placeholder';img.src='/assets/cover-placeholder.svg';}}}/>;
}
