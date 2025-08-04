
const API_URL = 'http://localhost:5000/api';


const send_get = async (path: string, header?: any) => {

    const response = await fetch(API_URL + path, {
        headers: {
            'Content-Type': 'application/json',
            ...header
        }
    })

    if (!response.ok) {
        const error_msg = "Error in GET request to: " + API_URL + path + "\nMessage: " + JSON.stringify(await response.json())
        return { "error": error_msg }
    }

    return await response.json();
}

const send_post = async (path: string, payload?: any, header?: any) => {
    const response = await fetch(API_URL + path, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            ...header
        },
    })

    if (!response.ok) {
        const error_msg = "Error in POST request to: " + API_URL + path + "\nMessage: " + JSON.stringify(await response.json())
        return { "error": error_msg }
    }

    return await response.json();
}

const send_put = async (path: string, payload?: any, header?: any) => {
    const response = await fetch(API_URL + path, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            ...header
        },
    })

    if (!response.ok) {
        const error_msg = "Error in PUT request to: " + API_URL + path + "\nMessage: " + JSON.stringify(await response.json())
        return { "error": error_msg }
    }

    return await response.json();
}

const send_delete = async (path: string, payload?: any, header?: any) => {
    const response = await fetch(API_URL + path, {
        method: 'DELETE',
        body: payload ? JSON.stringify(payload) : null,
        headers: {
            'Content-Type': 'application/json',
            ...header
        },
    });

    if (!response.ok) {
        const error_msg = "Error in DELETE request to: " + API_URL + path + "\nMessage: " + JSON.stringify(await response.json());
        return { error: error_msg };
    }

    return await response.json();
};

const send_form = async (
    path: string,
    formData: FormData,
    headers: any = {}
) => {
    const response = await fetch(API_URL + path, {
        method: 'POST',
        body: formData,
        headers: {
            ...headers, // Don't include Content-Type – fetch handles it for FormData
        },
    });

    if (!response.ok) {
        const error_msg =
            "Error in POST request to: " +
            API_URL +
            path +
            "\nMessage: " +
            JSON.stringify(await response.json());
        return { error: error_msg };
    }

    return await response.json();
};


export {
    send_get,
    send_post,
    send_put,
    send_delete,
    send_form
}