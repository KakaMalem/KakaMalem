'use client'

import React from 'react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Account Settings</h2>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">Preferences</h3>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                <div>
                  <div className="font-medium">Newsletter Subscription</div>
                  <div className="text-sm opacity-70">
                    Receive updates about new products and offers
                  </div>
                </div>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Preferred Currency</span>
              </label>
              <select className="select select-bordered w-full max-w-xs" defaultValue="USD">
                <option>USD</option>
                <option>AF</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">Security</h3>
          <button className="btn btn-outline w-full md:w-auto">Change Password</button>
        </div>
      </div>

      <div className="card bg-accent/10 border border-accent">
        <div className="card-body">
          <h3 className="card-title text-lg text-accent">Danger Zone</h3>
          <p className="text-sm opacity-70 mb-4">
            Once you delete your account, there is no going back.
          </p>
          <button className="btn btn-accent btn-outline w-full md:w-auto">Delete Account</button>
        </div>
      </div>
    </div>
  )
}
