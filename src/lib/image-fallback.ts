const imageCache: Record<string, string> = {};

export function handleImageError(
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    title: string,
    videoId?: string
) {
    const img = e.currentTarget;
    const fallbackState = img.getAttribute('data-fallback') || '0';

    if (fallbackState === '0') {
        if (imageCache[title]) {
            img.setAttribute('data-fallback', 'cached');
            img.src = imageCache[title];
            return;
        }

        img.setAttribute('data-fallback', '1');
        if (videoId) {
            img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            return;
        }
    }

    /* if (fallbackState === '1' || (fallbackState === '0' && !videoId)) {
        img.setAttribute('data-fallback', '2');
        let jioSaavnUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encodeURIComponent(title)}&_format=json&_marker=0&ctx=web6dot0`;
        const isNative = (window as any).Capacitor?.isNative;
        if (!isNative && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.'))) {
            jioSaavnUrl = `/proxy/jiosaavn/api.php?__call=autocomplete.get&query=${encodeURIComponent(title)}&_format=json&_marker=0&ctx=web6dot0`;
        }
        fetch(jioSaavnUrl)
            .then(res => res.json())
            .then(data => {
                if ('songs' in data && 'data' in data['songs'] && data['songs']['data'].length > 0) {
                    let coverImg = data['songs']['data'][0]['image'];
                    coverImg = coverImg.replace('50x50', '500x500');
                    imageCache[title] = coverImg;
                    img.src = coverImg;
                } else {
                    img.setAttribute('data-fallback', '3');
                    imageCache[title] = 'https://via.placeholder.com/500?text=No+Cover';
                    img.src = imageCache[title];
                }
            })
            .catch(() => {
                img.setAttribute('data-fallback', '3');
                imageCache[title] = 'https://via.placeholder.com/500?text=No+Cover';
                img.src = imageCache[title];
            });
    } else if (fallbackState === '2' || fallbackState === 'cached') {
        img.setAttribute('data-fallback', '3');
        imageCache[title] = 'https://via.placeholder.com/500?text=No+Cover';
        img.src = imageCache[title];
    } */
}
