function sizeDisplay(sizeKB) {
    if (sizeKB < 1000) return `${Math.round(sizeKB)} KB`
    if (sizeKB > 1000) return `${Math.round(sizeKB/1000*10)/10} MB`
}

function typeDisplay(fileType) {
    const mimeTypeMappings = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xls',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
        'text/plain': 'txt',
        'application/zip': 'zip',
    };

    return mimeTypeMappings[fileType]
}

export { sizeDisplay, typeDisplay }