// SiYuan - Refactor your thinking
// Copyright (c) 2020-present, b3log.org
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package model

import "github.com/siyuan-note/siyuan/kernel/util"

func execNewVerInstallPkg(newVerInstallPkgPath string) {
}

func getNewVerInstallPkgPath() string {
	return ""
}

func checkDownloadInstallPkg() {
}

func getUpdatePkg() (downloadPkgURLs []string, checksum string, err error) {
	err = ErrOfficialServiceDisabled
	return
}

type Announcement struct {
	Id     string `json:"id"`
	Title  string `json:"title"`
	URL    string `json:"url"`
	Region int    `json:"region"`
}

func getAnnouncements() (ret []*Announcement) {
	return
}

func CheckUpdate(showMsg bool) {
	if showMsg {
		util.PushUpdateMsg("update-notify", ErrOfficialServiceDisabled.Error(), 3000)
	}
}

func skipNewVerInstallPkg() bool {
	return true
}
