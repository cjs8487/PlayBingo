import Login from '../../../../components/Login';
import Modal from '../Modal';

export default function LoginIntercept() {
    return (
        <Modal sx={{ p: 0 }}>
            <Login useRouterBack />
        </Modal>
    );
}
