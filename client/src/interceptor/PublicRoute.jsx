import { Navigate } from "react-router-dom"

function PublicRoute({children}) {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        return children;
    }
    else return <Navigate to="/home" replace />
}

export default PublicRoute