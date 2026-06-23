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

import (
	"encoding/hex"
	"errors"

	"github.com/88250/gulu"
	"github.com/siyuan-note/siyuan/kernel/conf"
	"github.com/siyuan-note/siyuan/kernel/util"
)

var ErrFailedToConnectCloudServer = errors.New("failed to connect cloud server")
var ErrOfficialServiceDisabled = errors.New("Official service is disabled in this fork.")

func CloudChatGPT(msg string, contextMsgs []string) (ret string, stop bool, err error) {
	stop = true
	err = ErrOfficialServiceDisabled
	return
}

func StartFreeTrial() (err error) {
	return ErrOfficialServiceDisabled
}

func DeactivateUser() (err error) {
	return ErrOfficialServiceDisabled
}

func RefreshCheckJob2H() {
}

func RefreshCheckJob6H() {
}

func refreshSubscriptionExpirationRemind() {
}

func refreshUser() {
}

func refreshCheckDownloadInstallPkg() {
}

func refreshAnnouncement() {
}

func RefreshUser(token string) {
	if "" != token || nil != Conf.GetUser() || "" == Conf.UserData {
		return
	}

	if user := loadUserFromConf(); nil != user {
		Conf.SetUser(user)
	}
}

func loadUserFromConf() *conf.User {
	if "" == Conf.UserData {
		return nil
	}

	data := util.AESDecrypt(Conf.UserData)
	data, _ = hex.DecodeString(string(data))
	user := &conf.User{}
	if err := gulu.JSON.UnmarshalJSON(data, &user); err == nil {
		return user
	}
	return nil
}

func RemoveCloudShorthands(ids []string) (err error) {
	return ErrOfficialServiceDisabled
}

func GetCloudShorthand(id string) (ret map[string]any, err error) {
	err = ErrOfficialServiceDisabled
	return
}

func GetCloudShorthands(page int) (result map[string]any, err error) {
	err = ErrOfficialServiceDisabled
	return
}

func UseActivationcode(code string) (err error) {
	return ErrOfficialServiceDisabled
}

func CheckActivationcode(code string) (retCode int, msg string) {
	return -1, ErrOfficialServiceDisabled.Error()
}

func Login(userName, password, captcha string, cloudRegion int) (ret *gulu.Result) {
	ret = gulu.Ret.NewResult()
	ret.Code = -1
	ret.Msg = ErrOfficialServiceDisabled.Error()
	return
}

func Login2fa(token, code string) (map[string]any, error) {
	return nil, ErrOfficialServiceDisabled
}

func LogoutUser() {
	Conf.UserData = ""
	Conf.SetUser(nil)
	Conf.Save()
}
