import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function getHighResCover(url?: string): string {
    if (!url) return 'https://via.placeholder.com/500';

    let processedUrl = url;
    if (processedUrl.includes('=')) {
        processedUrl = processedUrl.replace(/=w\d+-h\d+/, '=w1080-h1080').replace(/=s\d+/, '=w1080-h1080');
    }
    if (processedUrl.includes('sqdefault.jpg') || processedUrl.includes('hqdefault.jpg') || processedUrl.includes('sddefault.jpg')) {
        processedUrl = processedUrl.replace(/(sq|hq|sd)default\.jpg/, 'maxresdefault.jpg');
    }
    return processedUrl.replace(/w\d+-h\d+/, 'w1080-h1080');
}
