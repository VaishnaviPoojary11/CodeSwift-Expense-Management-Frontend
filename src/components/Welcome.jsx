import { useState } from "react";

function Welcome({ onCreateGroup, groups, onSelectGroup }) {
    const [showGroups, setShowGroups] = useState(false);

    return (
        <div className="welcome-page">

            <div className="brand-title">
                Expense Manager
            </div>

            <div className="welcome-card">

                <h2>
                    Welcome <span className="heart">♥</span>
                </h2>

                <p>
                    Manage your group expenses easily. Create a group,
                    add members, track expenses, calculate settlements,
                    and view your complete overview.
                </p>

                <div className="welcome-actions">

                    <button
                        className="primary-btn"
                        onClick={onCreateGroup}
                    >
                        + Create Group
                    </button>

                    <div className="select-group-wrapper">

                        <button
                            className="secondary-btn"
                            onClick={() => setShowGroups(!showGroups)}
                        >
                            Select Group {showGroups ? "▲" : "▼"}
                        </button>

                        {showGroups && (
                            <div className="group-dropdown">

                                {groups.length === 0 ? (
                                    <div className="no-groups">
                                        No groups created yet
                                    </div>
                                ) : (
                                    groups.map(group => (
                                        <button
                                            key={group.id}
                                            onClick={() => {
                                                onSelectGroup(group);
                                                setShowGroups(false);
                                            }}
                                        >
                                            <span>{group.name}</span>
                                            <span>→</span>
                                        </button>
                                    ))
                                )}

                            </div>
                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Welcome;