import Login from '../../../../components/Login';
import Modal from '../Modal';

export default function LoginIntercept() {
    return (
        <Modal>
            <Login useRouterBack />
        </Modal>
    );
}
