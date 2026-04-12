export default function SetupModal({ onClose }) {
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <h2>Prilagodba polja</h2>
                <p>
                    Ovdje će korisnik kasnije moći postaviti karte na monster i spell/trap zone.
                </p>
                <button onClick={onClose}>Zatvori</button>
            </div>
        </div>
    );
}