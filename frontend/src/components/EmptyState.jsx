export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-icon"><Icon size={24} /></span>}
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
