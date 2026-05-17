import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
// import Login from './pages/user-login/Login'
import Login from '@/pages/user-login/Login';
function App() {

	return (
		<>
			<BrowserRouter>
			<Routes>
				<Route path='/login' element={<Login/>}/>
			</Routes>
			</BrowserRouter>
		</>
	)
}

export default App
