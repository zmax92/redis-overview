const deleteFnt = (id) => {
    fetch('/' + id, {
        method: 'DELETE',
    })
    .then(() => {
        window.location = '/';
    });
}
