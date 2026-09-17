import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router'

export function NotFoundPage() { return <div className="not-found"><FileQuestion /><span>404</span><h1>Page not found</h1><p>The requested Contract Intelligence view does not exist.</p><Link to="/overview">Return to overview</Link></div> }
