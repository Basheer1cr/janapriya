{loading ? (
          <div className="bg-white rounded-2xl p-8 text-center font-bold text-slate-500">
            Loading AI Priority Clusters...
          </div>
        ) : priorities.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
            <p className="text-base font-extrabold text-slate-800">
              No citizen submissions recorded yet.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Go to the &quot;Citizen Submit&quot; tab and submit a real grievance to see it clustered, mapped, and ranked here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {priorities.map((cluster) => (
              <PriorityCard
                key={cluster.id}
                cluster={cluster}
                onViewProofs={handleViewProofs}
                onUpdateStatus={handleStatusChange}
              />
            ))}
          </div>
        )}