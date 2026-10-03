import { useEffect, useState } from "react";
import "./App.css";
import API_URL from "./api";

import Welcome from "./components/Welcome";
import CreateGroup from "./components/CreateGroup";
import Expenses from "./components/Expense";
import Calculation from "./components/Calculation";
import Settlement from "./components/Settlement";
import Overview from "./components/Overview";

function App() {
  const [page, setPage] = useState("welcome");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  /* =================================================
       LOAD GROUPS
       ================================================= */

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups`);

      if (!response.ok) {
        throw new Error("Failed to load groups");
      }

      const data = await response.json();

      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  /* =================================================
       CREATE GROUP
       ================================================= */

  const createGroup = async (name, memberList) => {
    try {
      /* CREATE GROUP */

      const groupResponse = await fetch(`${API_URL}/api/groups`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name,
        }),
      });

      if (!groupResponse.ok) {
        throw new Error("Failed to create group");
      }

      const createdGroup = await groupResponse.json();

      /* SAVE MEMBERS */

      for (const member of memberList) {
        const memberResponse = await fetch(
          `${API_URL}/api/members`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              name: member.name,

              group: {
                id: createdGroup.id,
              },
            }),
          },
        );

        if (!memberResponse.ok) {
          throw new Error(`Failed to save member: ${member.name}`);
        }
      }

      /* LOAD SAVED MEMBERS */

      const membersResponse = await fetch(
        `${API_URL}/api/members/group/${createdGroup.id}`,
      );

      if (!membersResponse.ok) {
        throw new Error("Failed to load members");
      }

      const savedMembers = await membersResponse.json();

      /* REFRESH GROUP LIST */

      await loadGroups();

      /* SELECT CREATED GROUP */

      setSelectedGroup({
        id: createdGroup.id,
        name: createdGroup.name,
        members: savedMembers,
      });

      setPage("group-created");
    } catch (error) {
      console.error("Create group error:", error);

      alert(error.message);
    }
  };

  /* =================================================
       PAGE 2 — CREATE GROUP
       ================================================= */

  if (page === "create-group") {
    return (
      <CreateGroup
        onBack={() => setPage("welcome")}
        onCreated={createGroup}
      />
    );
  }

  /* =================================================
       PAGE 3 — GROUP CREATED
       ================================================= */

  if (page === "group-created") {
    if (!selectedGroup) {
      return null;
    }

    return (
      <div className="group-page">
        <div className="success-icon">✓</div>

        <h1 className="success-title">Group Created!</h1>

        <p className="success-text">
          Your group is ready to manage shared expenses.
        </p>

        <div className="group-card created-card">
          <h2>{selectedGroup.name}</h2>

          <div className="member-heading">Members</div>

          <div className="created-members">
            {selectedGroup.members &&
            selectedGroup.members.length > 0 ? (
              selectedGroup.members.map((member) => (
                <div className="created-member" key={member.id}>
                  <span className="avatar">
                    {member.name.charAt(0).toUpperCase()}
                  </span>

                  <span className="created-member-name">
                    {member.name}
                  </span>

                  <span className="member-check">✓</span>
                </div>
              ))
            ) : (
              <p className="no-members">No members found.</p>
            )}
          </div>
        </div>

        <div className="page-actions">
          <button
            className="primary-btn"
            onClick={() => setPage("expenses")}
          >
            Continue to Expenses →
          </button>

          <button
            className="secondary-btn"
            onClick={() => setPage("welcome")}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* =================================================
       PAGE 4 — EXPENSES
       ================================================= */

  if (page === "expenses") {
    if (!selectedGroup) {
      return null;
    }

    return (
      <Expenses
        groupId={selectedGroup.id}
        groups={groups}
        onGroupChange={(group) => {
          setSelectedGroup(group);
        }}
        onNext={() => setPage("calculation")}
        onBack={() => setPage("welcome")}
      />
    );
  }

  /* =================================================
       PAGE 5 — EXPENSE CALCULATION
       ================================================= */

  if (page === "calculation") {
    if (!selectedGroup) {
      return null;
    }

    return (
      <Calculation
        groupId={selectedGroup.id}
        groups={groups}
        onSettlement={() => setPage("settlement")}
        onBack={() => setPage("expenses")}
        onHome={() => setPage("welcome")}
      />
    );
  }

  /* =================================================
       PAGE 6 — SETTLEMENT LOGIC
       ================================================= */

  if (page === "settlement") {
    if (!selectedGroup) {
      return null;
    }

    return (
      <Settlement
        groupId={selectedGroup.id}
        groups={groups}
        onBack={() => setPage("calculation")}
        onHome={() => setPage("welcome")}
        onOverview={() => setPage("overview")}
      />
    );
  }

  /* =================================================
       PAGE 7 — OVERVIEW
       ================================================= */

  if (page === "overview") {
    if (!selectedGroup) {
      return null;
    }

    return (
      <Overview
        groupId={selectedGroup.id}
        groups={groups}
        onBack={() => setPage("settlement")}
        onHome={() => setPage("welcome")}
      />
    );
  }

  /* =================================================
       PAGE 1 — WELCOME
       ================================================= */

  return (
    <Welcome
      onCreateGroup={() => {
        setPage("create-group");
      }}
      groups={groups}
      onSelectGroup={(group) => {
        setSelectedGroup(group);

        setPage("expenses");
      }}
    />
  );
}

export default App;