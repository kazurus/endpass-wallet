<template>
  <div>
    <v-form
      :is-form-valid="isFormValid"
      data-test="import-json-form"
      @submit="togglePasswordModal"
    >
      <div class="field">
        <div class="file">
          <label class="file-label">
            <input
              v-validate="'required'"
              class="file-input"
              type="file"
              name="jsonWallet"
              data-test="input-file"
              @change="setFile"
            >
            <span class="file-cta">
              <span class="file-icon">
                <span
                  class="icon is-small"
                  v-html="require('@/img/arrow-thick-top.svg')"
                />
              </span>
              <span
                class="file-label"
                v-text="fileName"
              />
            </span>
          </label>
        </div>
        <p
          v-show="errors.has('fileName')"
          class="help is-danger"
        >
          {{ errors.first('fileName') }}
        </p>
      </div>

      <v-password
        id="jsonKeystorePassword"
        key="jsonKeystorePasswordUnique"
        v-model="jsonKeystorePassword"
        v-validate="'required|min:8'"
        :error="errors.first('jsonKeystorePassword')"
        :label="$t('components.importFromJson.v3JsonkeystorePassword')"
        name="jsonKeystorePassword"
        data-vv-name="jsonKeystorePassword"
        data-vv-as="password"
        aria-describedby="jsonKeystorePassword"
        :placeholder="$t('components.importFromJson.v3JsonkeystorePassword')"
        required
        data-test="input-json-file-password"
      />

      <v-button
        :loading="isCreating"
        :disabled="!isFormValid"
        class-name="is-primary is-cta"
        data-test="submit-import"
      >
        {{ $t('global.import') }}
      </v-button>
    </v-form>

    <password-modal
      v-if="isPasswordModal"
      @close="togglePasswordModal"
      @confirm="handlePasswordConfirm"
    >
      {{ $t('components.importFromJson.passwordModalText') }}
    </password-modal>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import isV3 from '@endpass/utils/isV3';
import PasswordModal from '@/components/modal/PasswordModal';
import modalMixin from '@/mixins/modal';
import formMixin from '@/mixins/form';

export default {
  name: 'ImportFromJson',
  data: () => ({
    isCreating: false,
    jsonKeystorePassword: '',
    file: null,
    fileData: null,
  }),
  computed: {
    fileName() {
      const { file } = this;

      return file ? file.name : this.$t('components.importFromJson.V3JsonFile');
    },
  },
  watch: {
    jsonKeystorePassword() {
      this.errors.removeById('wrongPass');
    },
  },
  methods: {
    ...mapActions('accounts', ['addWalletWithV3']),

    async handlePasswordConfirm(walletPassword) {
      this.isCreating = true;
      this.togglePasswordModal();

      try {
        await this.addWalletWithV3({
          json: this.fileData,
          jsonPassword: this.jsonKeystorePassword,
          walletPassword,
        });

        this.$router.push('/');
      } catch (e) {
        this.errors.add({
          field: 'jsonKeystorePassword',
          msg: this.$t('components.importFromJson.V3Invalid'),
          id: 'wrongPass',
        });
      }

      this.isCreating = false;
    },
    setFile({ target }) {
      const [file] = target.files;

      this.errors.removeById('wrongFile');
      this.fileData = null;
      this.file = file;

      if (!this.file) return;

      const reader = new FileReader();
      const fileReaderError = {
        field: 'fileName',
        msg: this.$t('components.importFromJson.fileInvalid'),
        id: 'wrongFile',
      };

      reader.onload = ({ target: { result } }) => {
        try {
          const fileData = JSON.parse(result);

          if (isV3(fileData)) {
            this.fileData = fileData;
          } else {
            this.errors.add(fileReaderError);
          }
        } catch (e) {
          this.errors.add(fileReaderError);
        }
      };

      reader.onerror = () => this.errors.add(fileReaderError);

      reader.readAsText(this.file);
    },
  },
  mixins: [modalMixin, formMixin],
  components: {
    PasswordModal,
  },
};
</script>

<style lang="scss"></style>
