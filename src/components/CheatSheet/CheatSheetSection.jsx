import PropTypes from 'prop-types';

export default function CheatSheetSection({ section }) {
  return (
    <div className="cheatsheet-section">
      <h3>{section.title}</h3>
      <div className="cheatsheet-section-content">
        {section.items.map((item, index) => (
          <div key={index} className="cheatsheet-item">
            {item.subtitle && <h4>{item.subtitle}</h4>}
            {item.description && <p>{item.description}</p>}
            {item.list && (
              <ul>
                {item.list.map((li, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: li }} />
                ))}
              </ul>
            )}
            {item.code && <pre>{item.code}</pre>}
            {item.tip && <p className="tip" dangerouslySetInnerHTML={{ __html: item.tip }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

CheatSheetSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    searchTerms: PropTypes.arrayOf(PropTypes.string).isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        subtitle: PropTypes.string,
        code: PropTypes.string,
        description: PropTypes.string,
        list: PropTypes.arrayOf(PropTypes.string),
        tip: PropTypes.string
      })
    ).isRequired
  }).isRequired
};
