import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Select from "react-select";
import countryList from "react-select-country-list";
import PhoneInput from "react-phone-input-2";

import "react-phone-input-2/lib/style.css";

import PageShell from "./PageShell";
import { useI18n } from "../i18n";

import "./Profile.css";

const SafePhoneInput =
  PhoneInput.default || PhoneInput;

/* =========================================================
   API CONFIGURATION
========================================================= */

const RAW_API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

const API = RAW_API_BASE
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

/* =========================================================
   HELPERS
========================================================= */

const readStoredUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch (error) {
    console.error(
      "Stored user parse error:",
      error
    );

    return {};
  }
};

const normalizeUser = (user = {}) => {
  const role = String(
    user.role || "user"
  )
    .trim()
    .toLowerCase();

  return {
    ...user,

    id:
      user.id ||
      user._id ||
      "",

    uid: user.uid
      ? String(user.uid)
      : "",

    role,

    isOwner:
      user.isOwner === true ||
      role === "owner",

    isAdmin:
      user.isAdmin === true ||
      [
        "admin",
        "super_admin",
        "owner",
      ].includes(role),

    isActive:
      user.isActive !== false,

    isBlocked:
      user.isBlocked === true,

    accountStatus:
      user.accountStatus ||
      "Active",

    isEmailVerified:
      user.isEmailVerified === true,

    twoFactorEnabled:
      user.twoFactorEnabled === true,

    adminTwoFactorRequired:
      user.adminTwoFactorRequired === true,

    withdrawalTwoFactorRequired:
      user.withdrawalTwoFactorRequired ===
      true,
  };
};

const parseApiResponse = async (
  response
) => {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text = await response.text();

  throw new Error(
    text ||
      `Server returned ${response.status}`
  );
};

/* =========================================================
   PROFILE COMPONENT
========================================================= */

function Profile() {
  const { t, lang } = useI18n();

  const countryOptions = useMemo(
    () => countryList().getData(),
    []
  );

  const [user, setUser] = useState(() =>
    normalizeUser(readStoredUser())
  );

  const [kycStatus, setKycStatus] =
    useState(
      user.kycStatus ||
        "not_submitted"
    );

  const [phone, setPhone] =
    useState(user.phone || "");

  const [country, setCountry] =
    useState(user.country || "");

  const [telegram, setTelegram] =
    useState(user.telegram || "");

  const [bio, setBio] =
    useState(user.bio || "");

  const [
    currentProfileImage,
    setCurrentProfileImage,
  ] = useState(
    typeof user.profileImage ===
      "string"
      ? user.profileImage
      : ""
  );

  const [
    selectedProfileFile,
    setSelectedProfileFile,
  ] = useState(null);

  const [
    profilePreview,
    setProfilePreview,
  ] = useState(
    typeof user.profileImage ===
      "string"
      ? user.profileImage
      : ""
  );

  const [
    twoFactorEnabled,
    setTwoFactorEnabled,
  ] = useState(
    user.twoFactorEnabled === true
  );

  const [
    phoneCountry,
    setPhoneCountry,
  ] = useState("us");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* =========================================================
     TRANSLATION FALLBACK

     This keeps Profile working while the new global
     translator architecture is being prepared.
  ========================================================= */

  const text = (
    key,
    fallback
  ) => {
    const translated = t(key);

    if (
      !translated ||
      translated === key
    ) {
      return fallback;
    }

    return translated;
  };

  /* =========================================================
     SAVE USER LOCALLY WITHOUT LOSING OWNER FIELDS
  ========================================================= */

  const saveUserLocally = (
    updatedUser
  ) => {
    const storedUser =
      readStoredUser();

    const mergedUser =
      normalizeUser({
        ...storedUser,
        ...user,
        ...updatedUser,

        role:
          updatedUser?.role ||
          user.role ||
          storedUser.role,

        isOwner:
          updatedUser?.isOwner ??
          user.isOwner ??
          storedUser.isOwner,

        isAdmin:
          updatedUser?.isAdmin ??
          user.isAdmin ??
          storedUser.isAdmin,
      });

    localStorage.setItem(
      "user",
      JSON.stringify(mergedUser)
    );

    setUser(mergedUser);

    setTwoFactorEnabled(
      mergedUser.twoFactorEnabled ===
        true
    );

    return mergedUser;
  };

  /* =========================================================
     SESSION FAILURE
  ========================================================= */

  const clearExpiredSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem(
      "require2FASetup"
    );
  };

  /* =========================================================
     COUNTRY / PHONE COUNTRY
  ========================================================= */

  const updatePhoneCountry = (
    countryName
  ) => {
    if (!countryName) {
      setPhoneCountry("us");
      return;
    }

    const found =
      countryOptions.find(
        (option) =>
          option.label ===
          countryName
      );

    setPhoneCountry(
      found?.value
        ? String(
            found.value
          ).toLowerCase()
        : "us"
    );
  };

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProfile =
      async () => {
        try {
          setLoading(true);

          const token =
            localStorage.getItem(
              "token"
            );

          const storedUser =
            normalizeUser(
              readStoredUser()
            );

          if (!token) {
            if (!cancelled) {
              setUser(storedUser);
              setPhone(
                storedUser.phone || ""
              );
              setCountry(
                storedUser.country || ""
              );
              setTelegram(
                storedUser.telegram || ""
              );
              setBio(
                storedUser.bio || ""
              );
              setCurrentProfileImage(
                storedUser.profileImage ||
                  ""
              );
              setProfilePreview(
                storedUser.profileImage ||
                  ""
              );
              setTwoFactorEnabled(
                storedUser
                  .twoFactorEnabled ===
                  true
              );
              setKycStatus(
                storedUser.kycStatus ||
                  "not_submitted"
              );

              updatePhoneCountry(
                storedUser.country
              );
            }

            return;
          }

          const response =
            await fetch(
              `${API}/api/auth/me`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            await parseApiResponse(
              response
            );

          if (
            response.status === 401
          ) {
            clearExpiredSession();

            throw new Error(
              text(
                "sessionExpiredLoginAgain",
                "Your session has expired. Please login again."
              )
            );
          }

          if (
            !response.ok ||
            !data.success ||
            !data.user
          ) {
            throw new Error(
              data.message ||
                text(
                  "profileLoadFailed",
                  "Failed to load profile."
                )
            );
          }

          const profileUser =
            normalizeUser({
              ...storedUser,
              ...data.user,
            });

          if (cancelled) {
            return;
          }

          saveUserLocally(
            profileUser
          );

          setPhone(
            profileUser.phone || ""
          );

          setCountry(
            profileUser.country || ""
          );

          setTelegram(
            profileUser.telegram || ""
          );

          setBio(
            profileUser.bio || ""
          );

          setCurrentProfileImage(
            profileUser.profileImage ||
              ""
          );

          setProfilePreview(
            profileUser.profileImage ||
              ""
          );

          setKycStatus(
            profileUser.kycStatus ||
              "not_submitted"
          );

          updatePhoneCountry(
            profileUser.country
          );

          /*
            KYC status endpoint is loaded separately
            because some deployments maintain a
            dedicated KYC record.
          */
          if (profileUser.email) {
            try {
              const kycResponse =
                await fetch(
                  `${API}/api/kyc/user/${encodeURIComponent(
                    profileUser.email
                  )}`,
                  {
                    headers: {
                      Authorization:
                        `Bearer ${token}`,
                    },
                  }
                );

              const kycData =
                await parseApiResponse(
                  kycResponse
                );

              if (
                !cancelled &&
                kycResponse.ok &&
                kycData.success
              ) {
                const status =
                  kycData.status ||
                  "not_submitted";

                setKycStatus(status);

                saveUserLocally({
                  ...profileUser,
                  kycStatus: status,
                });
              }
            } catch (
              kycError
            ) {
              console.warn(
                "KYC status load skipped:",
                kycError.message
              );
            }
          }
        } catch (error) {
          console.error(
            "Profile load error:",
            error
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadProfile();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryOptions, lang]);

  /* =========================================================
     CLEAN IMAGE PREVIEW
  ========================================================= */

  useEffect(() => {
    return () => {
      if (
        profilePreview &&
        profilePreview.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          profilePreview
        );
      }
    };
  }, [profilePreview]);

  /* =========================================================
     WALLET INFORMATION
  ========================================================= */

  const connectedWallet =
    localStorage.getItem(
      "wallet"
    ) ||
    localStorage.getItem(
      "walletAddress"
    ) ||
    user.walletAddress ||
    user.wallet ||
    "";

  const shortWallet =
    connectedWallet &&
    connectedWallet.length > 12
      ? `${connectedWallet.slice(
          0,
          6
        )}...${connectedWallet.slice(
          -4
        )}`
      : connectedWallet ||
        text(
          "notConnected",
          "Not connected"
        );

  /* =========================================================
     PROFILE IMAGE SELECTION
  ========================================================= */

  const handleImageSelection = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        text(
          "imageTypeInvalid",
          "Only JPG, PNG and WEBP images are allowed."
        )
      );

      event.target.value = "";
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {
      alert(
        text(
          "imageTooLarge",
          "Profile image must be smaller than 5 MB."
        )
      );

      event.target.value = "";
      return;
    }

    if (
      profilePreview &&
      profilePreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        profilePreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedProfileFile(
      file
    );

    setProfilePreview(
      previewUrl
    );
  };

  /* =========================================================
     UPDATE PROFILE
  ========================================================= */

  const updateProfile =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          alert(
            text(
              "pleaseLoginFirst",
              "Please login first"
            )
          );
          return;
        }

        setSaving(true);

        const formData =
          new FormData();

        formData.append(
          "name",
          user.name || ""
        );

        formData.append(
          "phone",
          phone || ""
        );

        formData.append(
          "country",
          country || ""
        );

        formData.append(
          "telegram",
          telegram || ""
        );

        formData.append(
          "bio",
          bio || ""
        );

        if (
          selectedProfileFile
        ) {
          formData.append(
            "profileImage",
            selectedProfileFile
          );
        }

        const response =
          await fetch(
            `${API}/api/auth/profile`,
            {
              method: "PUT",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body: formData,
            }
          );

        const data =
          await parseApiResponse(
            response
          );

        if (
          response.status === 401
        ) {
          clearExpiredSession();

          alert(
            text(
              "sessionExpiredLoginAgain",
              "Your session has expired. Please login again."
            )
          );

          return;
        }

        if (
          response.ok &&
          data.success &&
          data.user
        ) {
          const updatedUser =
            saveUserLocally({
              ...user,
              ...data.user,

              role:
                data.user.role ||
                user.role,

              isOwner:
                data.user.isOwner ??
                user.isOwner,

              isAdmin:
                data.user.isAdmin ??
                user.isAdmin,

              kycStatus,
            });

          setPhone(
            updatedUser.phone ||
              phone
          );

          setCountry(
            updatedUser.country ||
              country
          );

          setTelegram(
            updatedUser.telegram ||
              telegram
          );

          setBio(
            updatedUser.bio ||
              bio
          );

          const savedImage =
            updatedUser.profileImage ||
            currentProfileImage ||
            profilePreview;

          setCurrentProfileImage(
            savedImage
          );

          setProfilePreview(
            savedImage
          );

          setSelectedProfileFile(
            null
          );

          alert(
            text(
              "profileUpdatedSuccessfully",
              "Profile updated successfully"
            )
          );

          return;
        }

        alert(
          data.message ||
            text(
              "profileUpdateFailed",
              "Profile update failed"
            )
        );
      } catch (error) {
        console.error(
          "Profile update error:",
          error
        );

        alert(
          error.message ||
            text(
              "updateFailed",
              "Update failed"
            )
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     DISPLAY LABELS
  ========================================================= */

  const kycLabel =
    kycStatus === "approved"
      ? text(
          "verified",
          "Verified"
        )
      : kycStatus ===
          "rejected"
        ? text(
            "rejected",
            "Rejected"
          )
        : kycStatus ===
            "pending"
          ? text(
              "pending",
              "Pending"
            )
          : text(
              "notSubmitted",
              "Not Submitted"
            );

  const accountStatusLabel =
    user.isBlocked ||
    user.accountStatus ===
      "Suspended"
      ? user.accountStatus
      : text(
          "active",
          "Active"
        );

  const roleLabel =
    user.isOwner
      ? text(
          "ownerAccount",
          "Owner Account"
        )
      : user.isAdmin
        ? text(
            "adminAccount",
            "Admin Account"
          )
        : text(
            "regularUserAccount",
            "User Account"
          );

  if (loading) {
    return (
      <PageShell
        titleKey="profile"
        subtitleKey="manageAccountSecurity"
      >
        <div className="profile-page">
          <div className="profile-card">
            <p>
              {text(
                "loading",
                "Loading..."
              )}
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <PageShell
      titleKey="profile"
      subtitleKey="manageAccountSecurity"
    >
      <div className="profile-page">
        {/* ==================================================
            PROFILE HERO
        ================================================== */}

        <div className="profile-hero professional">
          <div className="profile-avatar">
            {profilePreview ? (
              <img
                src={profilePreview}
                alt={text(
                  "profile",
                  "Profile"
                )}
                className="profile-avatar-img"
              />
            ) : (
              String(
                user.name ||
                  user.email ||
                  "U"
              )
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div className="profile-main-info">
            <h2>
              {user.name ||
                text(
                  "userProfile",
                  "User Profile"
                )}
            </h2>

            <p>
              {user.email ||
                text(
                  "noEmailConnected",
                  "No email connected"
                )}
            </p>

            <div className="profile-badges-row">
              <span
                className={
                  twoFactorEnabled
                    ? "twofa-badge enabled"
                    : "twofa-badge disabled"
                }
              >
                {twoFactorEnabled
                  ? text(
                      "twoFaEnabled",
                      "2FA Enabled"
                    )
                  : text(
                      "twoFaDisabled",
                      "2FA Disabled"
                    )}
              </span>

              <span
                className={
                  kycStatus ===
                  "approved"
                    ? "profile-badge verified"
                    : kycStatus ===
                        "rejected"
                      ? "profile-badge rejected"
                      : "profile-badge pending"
                }
              >
                {kycLabel}
              </span>

              <span
                className={
                  user.isOwner
                    ? "profile-badge owner"
                    : user.isAdmin
                      ? "profile-badge admin"
                      : "profile-badge user"
                }
              >
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================
            PROFILE INFORMATION
        ================================================== */}

        <div className="profile-grid">
          <div className="profile-card">
            <h3>
              {text(
                "accountInformation",
                "Account Information"
              )}
            </h3>

            <p>
              <b>
                {text(
                  "userId",
                  "Exalt User ID"
                )}
                :
              </b>{" "}
              <span className="profile-user-uid">
                {user.uid ||
                  text(
                    "notAvailable",
                    "Not available"
                  )}
              </span>
            </p>

            <p>
              <b>
                {text(
                  "role",
                  "Role"
                )}
                :
              </b>{" "}
              {roleLabel}
            </p>

            <p>
              <b>
                {text(
                  "emailVerification",
                  "Email Verification"
                )}
                :
              </b>{" "}
              {user.isEmailVerified
                ? text(
                    "verified",
                    "Verified"
                  )
                : text(
                    "notVerified",
                    "Not Verified"
                  )}
            </p>
          </div>

          <div className="profile-card">
            <h3>
              {text(
                "profileSecurity",
                "Security"
              )}
            </h3>

            <p>
              <b>
                {text(
                  "twoFactorAuthentication",
                  "Two-Factor Authentication"
                )}
                :
              </b>{" "}
              {twoFactorEnabled
                ? text(
                    "enabled",
                    "Enabled"
                  )
                : text(
                    "disabled",
                    "Disabled"
                  )}
            </p>

            <p>
              <b>
                {text(
                  "kycStatus",
                  "KYC Status"
                )}
                :
              </b>{" "}
              {kycLabel}
            </p>

            <p>
              <b>
                {text(
                  "account",
                  "Account"
                )}
                :
              </b>{" "}
              {accountStatusLabel}
            </p>
          </div>

          <div className="profile-card">
            <h3>
              {text(
                "wallet",
                "Wallet"
              )}
            </h3>

            <p>
              <b>
                {text(
                  "status",
                  "Status"
                )}
                :
              </b>{" "}
              {connectedWallet
                ? text(
                    "connected",
                    "Connected"
                  )
                : text(
                    "notConnected",
                    "Not connected"
                  )}
            </p>

            <p>
              <b>
                {text(
                  "address",
                  "Address"
                )}
                :
              </b>{" "}
              {shortWallet}
            </p>

            <p>
              <b>
                {text(
                  "network",
                  "Network"
                )}
                :
              </b>{" "}
              BNB Smart Chain
            </p>
          </div>
        </div>

        {/* ==================================================
            EDIT PROFILE
        ================================================== */}

        <div className="profile-card edit-profile-card">
          <div className="edit-profile-header">
            <h3>
              {text(
                "editProfile",
                "Edit Profile"
              )}
            </h3>

            <p>
              {text(
                "updatePersonalSecurityDetails",
                "Update your personal, security and verification details."
              )}
            </p>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label>
                {text(
                  "phoneNumber",
                  "Phone Number"
                )}
              </label>

              <SafePhoneInput
                country={phoneCountry}
                value={phone}
                onChange={(value) =>
                  setPhone(value)
                }
                inputClass="profile-phone-input"
                buttonClass="profile-phone-button"
                dropdownClass="profile-phone-dropdown"
                enableSearch
                placeholder={text(
                  "enterPhoneNumber",
                  "Enter phone number"
                )}
                disabled={saving}
              />
            </div>

            <div className="profile-field">
              <label>
                {text(
                  "country",
                  "Country"
                )}
              </label>

              <Select
                className="profile-country-select"
                classNamePrefix="profile-select"
                options={countryOptions}
                placeholder={text(
                  "selectCountry",
                  "Select Country"
                )}
                value={
                  countryOptions.find(
                    (option) =>
                      option.label ===
                      country
                  ) || null
                }
                onChange={(
                  selected
                ) => {
                  const selectedCountry =
                    selected?.label ||
                    "";

                  setCountry(
                    selectedCountry
                  );

                  setPhoneCountry(
                    selected?.value
                      ? String(
                          selected.value
                        ).toLowerCase()
                      : "us"
                  );
                }}
                isSearchable
                isClearable
                isDisabled={saving}
                menuPortalTarget={
                  document.body
                }
                menuPosition="fixed"
              />
            </div>

            <div className="profile-field">
              <label>
                {text(
                  "telegramUsername",
                  "Telegram Username"
                )}
              </label>

              <input
                className="profile-input"
                placeholder="@telegram_username"
                value={telegram}
                onChange={(event) =>
                  setTelegram(
                    event.target.value
                  )
                }
                disabled={saving}
                maxLength={100}
              />
            </div>

            <div className="profile-field">
              <label>
                {text(
                  "profilePicture",
                  "Profile Picture"
                )}
              </label>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="profile-input"
                onChange={
                  handleImageSelection
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="profile-field">
            <label>
              {text(
                "professionalBio",
                "Professional Bio"
              )}
            </label>

            <textarea
              className="profile-input profile-bio"
              placeholder={text(
                "writeProfessionalBio",
                "Write a short professional bio about yourself"
              )}
              value={bio}
              onChange={(event) =>
                setBio(
                  event.target.value
                )
              }
              disabled={saving}
              maxLength={1000}
            />
          </div>

          <button
            type="button"
            className="save-profile-btn"
            onClick={updateProfile}
            disabled={saving}
          >
            {saving
              ? text(
                  "savingProfile",
                  "Saving Profile..."
                )
              : text(
                  "saveProfile",
                  "Save Profile"
                )}
          </button>
        </div>
      </div>
    </PageShell>
  );
}

export default Profile;