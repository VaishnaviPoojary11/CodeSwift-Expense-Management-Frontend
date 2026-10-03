import { useState } from "react";

function CreateGroup({ onBack, onCreated }) {
    const [groupName, setGroupName] = useState("");
    const [memberName, setMemberName] = useState("");
    const [members, setMembers] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const addOrUpdateMember = () => {
        if (!memberName.trim()) return;

        if (editingId) {
            setMembers(
                members.map(member =>
                    member.id === editingId
                        ? { ...member, name: memberName.trim() }
                        : member
                )
            );

            setEditingId(null);
        } else {
            setMembers([
                ...members,
                {
                    id: Date.now(),
                    name: memberName.trim()
                }
            ]);
        }

        setMemberName("");
    };

    const editMember = (member) => {
        setMemberName(member.name);
        setEditingId(member.id);
    };

    const deleteMember = (id) => {
        setMembers(members.filter(member => member.id !== id));
    };

    const createGroup = () => {
        if (!groupName.trim() || members.length === 0) return;

        onCreated(groupName, members);
    };

    return (
        <div className="group-page">

            <div className="group-card">

                <h1>Create a Group</h1>

                <label>Group Name</label>

                <input
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                />

                <label>Add Members</label>

                <div className="member-input">

                    <input
                        value={memberName}
                        onChange={e => setMemberName(e.target.value)}
                        onKeyDown={e =>
                            e.key === "Enter" && addOrUpdateMember()
                        }
                        placeholder="Enter member name"
                    />

                    <button
                        className="add-btn"
                        onClick={addOrUpdateMember}
                    >
                        {editingId ? "Update" : "+ Add Member"}
                    </button>

                </div>

                <div className="members-section">

                    <div className="member-heading">
                        <span>Members Added</span>
                    </div>

                    {members.map(member => (
                        <div className="member-card" key={member.id}>

                            <span className="avatar">
                                {member.name.charAt(0).toUpperCase()}
                            </span>

                            <span>{member.name}</span>

                            <div className="member-actions">

                                <button
                                    onClick={() => editMember(member)}
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => deleteMember(member.id)}
                                >
                                    Delete
                                </button>

                            </div>

                        </div>
                    ))}

                </div>

                <button
                    className="create-btn"
                    onClick={createGroup}
                >
                    Done →
                </button>

            </div>

            <button className="back-home" onClick={onBack}>
                ← Back to Home
            </button>

        </div>
    );
}

export default CreateGroup;