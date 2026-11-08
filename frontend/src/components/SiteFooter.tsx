import { Link } from 'react-router-dom'
import { institute } from '../data/site'
import { useInstituteContact } from '../data/instituteStore'
import { SocialIcons } from './SocialIcons'

export function SiteFooter() {
  const { contact } = useInstituteContact()

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <h2>
            <img
              src="/brand/logo.jpg"
              alt=""
              width={36}
              height={36}
              style={{
                verticalAlign: 'middle',
                marginRight: '0.5rem',
                borderRadius: 6,
              }}
            />
            {institute.fullName}
          </h2>
          <p className="muted" style={{ color: '#c5d5cb' }}>
            {institute.career}
          </p>
          <SocialIcons variant="panel" className="footer__social" />
        </div>
        <div>
          <h2>Contacto</h2>
          <ul>
            <li>Tel: {contact.phone}</li>
            <li>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            <li>{contact.address}</li>
          </ul>
          <p>
            <Link to="/contacto">Más información →</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
