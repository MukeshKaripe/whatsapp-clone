
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-xl mb-8">Page not found</p>
            <Button asChild>
                <Link to="/">Go back home</Link>
            </Button>
        </div>
    );
};

export default NotFound;