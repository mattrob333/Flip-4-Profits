// Loading skeletons at the final height of each screen (no spinners).

export function HomeSkeleton() {
  return (
    <div className="dash" aria-busy="true">
      <div className="panel hero em o1">
        <div className="sk" style={{ height: 14, width: 100 }} />
        <div className="sk" style={{ height: 64, width: 220, marginTop: 14 }} />
        <div className="sk" style={{ height: 16, width: 240, marginTop: 14 }} />
        <div className="sk" style={{ height: 10, marginTop: 12, borderRadius: 999 }} />
        <div className="sk sk-chart" style={{ marginTop: 28 }} />
      </div>
      <div className="o2">
        <div className="sk" style={{ height: 60, borderRadius: 14 }} />
      </div>
      <div className="rail">
        <div className="panel goal o3">
          <div className="sk" style={{ height: 14, width: 110 }} />
          <div className="sk" style={{ height: 18, width: "70%", marginTop: 14 }} />
          <div className="sk" style={{ height: 56, marginTop: 14 }} />
        </div>
        <div className="panel rail-panel o6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="sk" style={{ height: 44, marginTop: i ? 16 : 0 }} />
          ))}
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading your dashboard
      </p>
    </div>
  );
}

function Row() {
  return (
    <div
      style={{
        display: "grid", gridTemplateColumns: "64px 1fr 70px", gap: 14, alignItems: "center",
        padding: "12px 0", borderBottom: "1px solid rgb(255 255 255/.06)", height: 89,
      }}
    >
      <div className="sk" style={{ height: 64, borderRadius: 12 }} />
      <div>
        <div className="sk" style={{ height: 14, width: "70%" }} />
        <div className="sk" style={{ height: 12, width: "45%", marginTop: 8 }} />
      </div>
      <div className="sk" style={{ height: 20 }} />
    </div>
  );
}

export function DealsSkeleton() {
  return (
    <div aria-busy="true">
      <div className="page-head">
        <div>
          <h1>Loading deals…</h1>
          <div className="sk" style={{ height: 14, width: 220, marginTop: 10 }} />
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading deals
      </p>
      <div className="deals-grid">
        <div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Row key={i} />
          ))}
        </div>
        <aside className="ticket-col">
          <div className="ticket">
            <div className="sk sk-hero" />
            <div>
              <div className="sk" style={{ height: 20, width: "80%" }} />
              <div className="sk" style={{ height: 14, width: "50%", marginTop: 10 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
              <div className="sk" style={{ height: 92, borderRadius: 12 }} />
              <div className="sk" style={{ height: 92, borderRadius: 12 }} />
            </div>
            <div className="sk" style={{ height: 48, width: "55%" }} />
            <div className="sk" style={{ height: 56, borderRadius: 14 }} />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function StuffSkeleton() {
  return (
    <div aria-busy="true">
      <div className="page-head">
        <div>
          <h1>My Stuff</h1>
          <div className="sk" style={{ height: 14, width: 180, marginTop: 8 }} />
        </div>
      </div>
      <div className="stuff">
        <div className="left">
          <div className="hold">
            <div className="sk" style={{ height: 96 }} />
            <div className="sk" style={{ height: 80 }} />
            <div className="sk" style={{ height: 48 }} />
          </div>
        </div>
        <div className="panel ledger hidden lg:block">
          <div className="sk" style={{ height: 200 }} />
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading your stuff
      </p>
    </div>
  );
}
